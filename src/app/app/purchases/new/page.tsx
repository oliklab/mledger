"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { PurchasesStore } from '@/storage/purchases';
import { Material, MaterialStore } from '@/storage/materials';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';

// Utils and Icons
import { FormatCurrency } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Plus, Trash2, ArrowLeft } from 'lucide-react';

// Define the type for a single line item in our form state
type LineItem = {
  id: string; // A temporary ID for React keys
  materialId: string;
  quantity: string;
  cost: string;
  supplier_name: string;
  supplier_contact: string;
};

export default function NewPurchasePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form State
  const [purchaseDetails, setPurchaseDetails] = useState({
    name: `Purchase Record ${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`,
    purchase_date: new Date().toISOString().split('T')[0],
    status: 'Pending',
    notes: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), materialId: '', quantity: '', cost: '', supplier_name: '', supplier_contact: '' }
  ]);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);

  // System State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available materials for the dropdowns
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const supabase = await NewSPASassClient();
        const materialsData = await new MaterialStore(supabase).ReadAll();
        setAvailableMaterials(materialsData);
      } catch (err) {
        setError('Could not load materials. Please try again.');
      }
    };
    fetchMaterials();
  }, []);

  // Handlers for main details form
  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setPurchaseDetails(prev => ({ ...prev, [id]: value }));
  };

  // Handlers for line items
  const handleItemChange = (itemId: string, field: keyof Omit<LineItem, 'id'>, value: string) => {
    setLineItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddItem = () => {
    setLineItems(prev => [...prev, { id: crypto.randomUUID(), materialId: '', quantity: '', cost: '', supplier_name: '', supplier_contact: '' }]);
  };

  const handleRemoveItem = (itemId: string) => {
    setLineItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Calculate total cost on the fly
  const totalCost = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
  }, [lineItems]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!purchaseDetails.name || !purchaseDetails.purchase_date) {
      setError('Please provide a name and date for the purchase record.');
      return;
    }
    if (lineItems.some(item => !item.materialId || !item.quantity || !item.cost)) {
      setError('Please complete all fields for each line item.');
      return;
    }
    if (lineItems.length === 0) {
      setError('You must add at least one line item.');
      return;
    }

    setLoading(true);

    try {
      const supabase = await NewSPASassClient();
      const purchaseStore = new PurchasesStore(supabase);

      const itemsPayload = lineItems.map(item => {
        const material = availableMaterials.find(m => m.id === item.materialId);
        if (!material) throw new Error('Material not found for an item.');
        return {
          material_id: item.materialId,
          quantity: parseFloat(item.quantity) * material.conversion_factor,
          cost: parseFloat(item.cost),
          supplier_name: item.supplier_name,
          supplier_contact: item.supplier_contact,
        };
      });

      await purchaseStore.CreateWithItems({
        name: purchaseDetails.name,
        purchase_date: purchaseDetails.purchase_date,
        status: purchaseDetails.status,
        notes: purchaseDetails.notes,
        items: itemsPayload
      });

      toast({ title: "Success!", description: "Purchase record created successfully." });
      router.push('/app/purchases');

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" className="mb-2 pl-0 text-muted-foreground hover:text-primary" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Purchase</h1>
        <p className="text-muted-foreground mt-1">Group multiple material purchases into a single order.
          This will update your Material's Stocks and will Calculate the inventory and its current average cost.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Details Card */}
        <Card>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={purchaseDetails.name} onChange={handleDetailChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input id="purchase_date" type="date" value={purchaseDetails.purchase_date} onChange={handleDetailChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => setPurchaseDetails(p => ({ ...p, status: value }))} defaultValue={purchaseDetails.status}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" placeholder="e.g., Supplier name, order number..." value={purchaseDetails.notes} onChange={handleDetailChange} />
            </div>
          </CardContent>
        </Card>

        {/* Line Items Card */}
        <Card>
          <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {lineItems.map((item) => {
              const selectedMaterial = availableMaterials.find(m => m.id === item.materialId);
              return (
                <div key={item.id} className="p-4 border rounded-lg bg-slate-50 space-y-4">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 md:col-span-5 space-y-1"><Label>Material</Label><Select onValueChange={(value) => handleItemChange(item.id, 'materialId', value)} value={item.materialId}><SelectTrigger><SelectValue placeholder="Select a material..." /></SelectTrigger><SelectContent>{availableMaterials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="col-span-6 md:col-span-3 space-y-1"><Label>Quantity ({selectedMaterial?.purchase_unit || '...'})</Label><Input type="number" placeholder="e.g., 5" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} /></div>
                    <div className="col-span-6 md:col-span-3 space-y-1"><Label>Item Cost</Label><Input type="number" placeholder="e.g., 25.50" value={item.cost} onChange={(e) => handleItemChange(item.id, 'cost', e.target.value)} /></div>
                    <div className="col-span-12 md:col-span-1 flex justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} disabled={lineItems.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 mt-4">
                    <div className="space-y-1"><Label>Supplier Name <span className="text-xs text-muted-foreground">(Optional)</span></Label><Input placeholder="e.g., Craft Supplies Co." value={item.supplier_name} onChange={(e) => handleItemChange(item.id, 'supplier_name', e.target.value)} /></div>
                    <div className="space-y-1"><Label>Details <span className="text-xs text-muted-foreground">(Optional)</span></Label><Input placeholder="e.g., order #, phone" value={item.supplier_contact} onChange={(e) => handleItemChange(item.id, 'supplier_contact', e.target.value)} /></div>
                  </div>
                </div>
              );
            })}
            <Button type="button" variant="outline" onClick={handleAddItem} className="mt-2"><Plus className="h-4 w-4 mr-2" />Add Item</Button>
          </CardContent>
        </Card>

        {/* Total and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-100 rounded-lg">
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-muted-foreground">Total Order Cost</p>
            <p className="text-3xl font-bold tracking-tight text-gray-900">{FormatCurrency(totalCost)}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {error && <Alert variant="destructive" className="py-2 px-3 text-sm"><AlertCircle className="h-4 w-4 mr-2" />{error}</Alert>}
            <Button type="submit" size="lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Purchase Record
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}