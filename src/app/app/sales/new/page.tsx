"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { SalesStore } from '@/storage/sales';
import { Product, ProductStore } from '@/storage/products';
import { RecipeMetadata, RecipeStore } from '@/storage/recipes';
import { Material, MaterialStore } from '@/storage/materials';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Utils and Icons
import { FormatCurrency } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Plus, Trash2, ArrowLeft, Info, FileCheck2, FileText } from 'lucide-react';

// Enhanced type for product dropdown
type ProductForSale = Product & {
  recipe_cost: number;
};

// Type for a single line item in the form state
type LineItem = {
  id: string; // Temporary ID for React keys
  product_id: string;
  quantity: string;
  price_per_unit: string;
};

export default function NewSalePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form State
  const [saleDetails, setSaleDetails] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    customer_details: '',
    notes: '',
    status: 'Draft', // Default status
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), product_id: '', quantity: '1', price_per_unit: '' }
  ]);
  const [availableProducts, setAvailableProducts] = useState<ProductForSale[]>([]);

  // System State
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch products for the dropdown
  const loadProducts = useCallback(async () => {
    try {
      const supabase = await NewSPASassClient();
      const [productsData, recipesData, materialsData] = await Promise.all([
        new ProductStore(supabase).ReadAll(),
        new RecipeStore(supabase).ReadAllMetadata(),
        new MaterialStore(supabase).ReadAll()
      ]);

      const materialMap = new Map(materialsData.map(m => [m.id, m]));
      const recipeMap = new Map(recipesData.map(r => [r.recipe.id, r]));

      const enhancedProducts = productsData.map(product => {
        const recipe = recipeMap.get(product.recipe_id);
        const recipe_cost = recipe?.materials.reduce((sum, item) => {
          const material = materialMap.get(item.material_id);
          return material ? sum + (item.quantity * material.avg_cost) : sum;
        }, 0) || 0;
        return { ...product, recipe_cost };
      });
      setAvailableProducts(enhancedProducts);
    } catch (err) {
      setError('Could not load products. Please refresh the page.');
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Handlers for main details form
  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaleDetails(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  // Handlers for line items
  const handleItemChange = (itemId: string, field: keyof Omit<LineItem, 'id'>, value: string) => {
    let updatedItems = lineItems.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    // If a product is selected, auto-fill its price
    if (field === 'product_id') {
      const product = availableProducts.find(p => p.id === value);
      if (product) {
        updatedItems = updatedItems.map(item =>
          item.id === itemId ? { ...item, price_per_unit: String(product.selling_price || '') } : item
        );
      }
    }
    setLineItems(updatedItems);
  };

  const handleAddItem = () => {
    setLineItems(prev => [...prev, { id: crypto.randomUUID(), product_id: '', quantity: '1', price_per_unit: '' }]);
  };

  const handleRemoveItem = (itemId: string) => {
    setLineItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Calculate total amount on the fly
  const totalAmount = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price_per_unit) || 0;
      return sum + (quantity * price);
    }, 0);
  }, [lineItems]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (lineItems.some(item => !item.product_id || !item.quantity || !item.price_per_unit)) {
      setError('Please complete all fields for each line item.');
      return;
    }
    setLoading(true);

    try {
      const supabase = await NewSPASassClient();
      const salesStore = new SalesStore(supabase);

      const itemsPayload = lineItems.map(item => {
        const product = availableProducts.find(p => p.id === item.product_id);
        if (!product) throw new Error('Selected product not found.');
        return {
          product_id: item.product_id,
          quantity: parseFloat(item.quantity),
          price_per_unit: parseFloat(item.price_per_unit),
          cost_per_unit_at_sale: product.recipe_cost,
        };
      });

      const salePayload = {
        saleDetails: { ...saleDetails, status: saleDetails.status },
        items: itemsPayload
      };

      if (saleDetails.status === 'Completed') {
        await salesStore.CreateAndCompleteSale(salePayload);
        toast({ title: "Sale Completed!", description: "The new sale has been recorded and stock has been deducted." });
      } else {
        await salesStore.CreateWithItems(salePayload);
        toast({ title: "Sale Created!", description: "The new sale has been saved as a draft." });
      }

      router.push('/app/sales');
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-8 max-w-4xl mx-auto"><Skeleton className="h-screen w-full" /></div>
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" className="mb-2 pl-0 text-muted-foreground hover:text-primary" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sales
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Record a New Sale</h1>
        <p className="text-muted-foreground mt-1">Record a new customer order. You can save it as a draft or complete it immediately.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Sale Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sale_date">Sale Date</Label>
              <Input id="sale_date" type="date" value={saleDetails.sale_date} onChange={handleDetailChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_details">Customer Details (Optional)</Label>
              <Input id="customer_details" placeholder="e.g., John Doe, johndoe@email.com" value={saleDetails.customer_details} onChange={handleDetailChange} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" placeholder="e.g., Order #, special instructions..." value={saleDetails.notes} onChange={handleDetailChange} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => setSaleDetails(p => ({ ...p, status: value }))} value={saleDetails.status}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Save as Draft</SelectItem>
                  <SelectItem value="Completed">Complete Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {saleDetails.status === 'Completed' ? (
              <Alert className="md:col-span-2">
                <FileCheck2 className="h-4 w-4" />
                <AlertTitle>This will be a Completed Sale</AlertTitle>
                <AlertDescription>Saving this sale as 'Completed' will immediately deduct the product quantities from your available stock.</AlertDescription>
              </Alert>
            ) : (
              <Alert className="md:col-span-2" variant="default">
                <FileText className="h-4 w-4" />
                <AlertTitle>This will be a Draft Sale</AlertTitle>
                <AlertDescription>Saving as a 'Draft' will not affect your stock levels. You will need to complete it later to deduct stock.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {lineItems.map((item) => {
              const selectedProduct = availableProducts.find(p => p.id === item.product_id);
              return (
                <div key={item.id} className="relative p-4 border rounded-lg bg-slate-50 space-y-4">
                  <div className="absolute top-2 right-2"><Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} disabled={lineItems.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6 space-y-1"><Label>Product</Label><Select onValueChange={(value) => handleItemChange(item.id, 'product_id', value)} value={item.product_id}><SelectTrigger><SelectValue placeholder="Select a product..." /></SelectTrigger><SelectContent>{availableProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({FormatCurrency(p.selling_price || 0)})</SelectItem>)}</SelectContent></Select></div>
                    <div className="md:col-span-3 space-y-1"><Label>Quantity</Label><Input type="number" placeholder="e.g., 1" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} /></div>
                    <div className="md:col-span-3 space-y-1"><Label>Price / Unit (€)</Label><Input type="number" step="any" placeholder="e.g., 25.00" value={item.price_per_unit} onChange={(e) => handleItemChange(item.id, 'price_per_unit', e.target.value)} /></div>
                  </div>
                  {selectedProduct && selectedProduct.current_stock < parseInt(item.quantity) && (<Alert variant="destructive" className="text-xs p-2"><AlertCircle className="h-4 w-4" /><AlertDescription>Warning: Stock is low ({selectedProduct.current_stock} available).</AlertDescription></Alert>)}
                </div>
              );
            })}
            <Button type="button" variant="outline" onClick={handleAddItem} className="mt-2"><Plus className="h-4 w-4 mr-2" />Add Item</Button>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-100 rounded-lg">
          <div className="text-center sm:text-left"><p className="text-sm font-medium text-muted-foreground">Total Sale Amount</p><p className="text-3xl font-bold tracking-tight text-gray-900">{FormatCurrency(totalAmount)}</p></div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {error && <Alert variant="destructive" className="py-2 px-3 text-sm"><AlertCircle className="h-4 w-4 mr-2" />{error}</Alert>}
            <Button type="submit" size="lg" disabled={loading || availableProducts.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saleDetails.status === 'Completed' ? 'Create & Complete Sale' : 'Save as Draft'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}