"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { NewSPASassClient } from '@/lib/supabase/client';
import { PurchasesStore, PurchaseMetadata } from '@/storage/purchases';
import { Material, MaterialStore } from '@/storage/materials';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { FormatCurrency } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Plus, Trash2, ArrowLeft } from 'lucide-react';

type LineItem = {
  id: string; // Temporary ID for React keys, or DB ID for existing items
  materialId: string;
  quantity: string;
  cost: string;
  supplier_name: string;
  supplier_contact: string;
};

export default function EditPurchasePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const purchaseId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Form State
  const [purchaseDetails, setPurchaseDetails] = useState({ name: '', purchase_date: '', status: 'Pending', notes: '' });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);

  // System State
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Data Fetching and State Initialization
  const loadPurchaseData = useCallback(async () => {
    if (!purchaseId) return;
    try {
      const supabase = await NewSPASassClient();
      const [purchaseMeta, materialsData] = await Promise.all([
        new PurchasesStore(supabase).ReadMetadata(purchaseId),
        new MaterialStore(supabase).ReadAll()
      ]);

      setAvailableMaterials(materialsData);
      setPurchaseDetails({
        name: purchaseMeta.purchase.name,
        purchase_date: purchaseMeta.purchase.purchase_date,
        status: purchaseMeta.purchase.status || 'Pending',
        notes: purchaseMeta.purchase.notes || '',
      });

      const materialMap = new Map(materialsData.map(m => [m.id, m]));
      setLineItems(purchaseMeta.materials.map(item => {
        const material = materialMap.get(item.material_id);
        const quantityInPurchaseUnit = material ? (item.total_quantity / material.conversion_factor) : 0;
        return {
          id: item.id,
          materialId: item.material_id,
          quantity: String(quantityInPurchaseUnit),
          cost: String(item.total_cost),
          supplier_name: item.supplier_name || '',
          supplier_contact: item.supplier_contact || '',
        };
      }));

    } catch (err) {
      setError('Could not load purchase order data.');
    } finally {
      setInitialLoading(false);
    }
  }, [purchaseId]);

  useEffect(() => {
    loadPurchaseData();
  }, [loadPurchaseData]);

  // Handlers for main details form, line items, and total cost calculation...
  // (These are identical to the NewPurchasePage)
  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setPurchaseDetails(prev => ({ ...prev, [e.target.id]: e.target.value }));
  const handleItemChange = (itemId: string, field: keyof Omit<LineItem, 'id'>, value: string) => setLineItems(items => items.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  const handleAddItem = () => setLineItems(prev => [...prev, { id: crypto.randomUUID(), materialId: '', quantity: '', cost: '', supplier_name: '', supplier_contact: '' }]);
  const handleRemoveItem = (itemId: string) => setLineItems(prev => prev.filter(item => item.id !== itemId));
  const totalCost = useMemo(() => lineItems.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0), [lineItems]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    //... (Add the same validation as the NewPurchasePage) ...

    if (!purchaseId) {
      setError("Purchase ID is missing. Cannot save changes.");
      return;
    }
    if (!purchaseDetails.name || !purchaseDetails.purchase_date) {
      setError('Please provide a name and date for the purchase order.');
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

      await purchaseStore.UpdateWithItems({
        purchaseId,
        ...purchaseDetails,
        items: itemsPayload
      });

      toast({ title: "Success!", description: "Purchase has been updated." });
      router.push(`/app/purchases/${purchaseId}`); // Navigate back to details page

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-8"><Skeleton className="h-screen w-full" /></div>
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" className="mb-2 pl-0 text-muted-foreground hover:text-primary" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Purchase</h1>
        <p className="text-muted-foreground mt-1">Modify the details of this purchase record. Saving will recalculate all associated stock levels.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* The entire form structure is identical to NewPurchasePage */}
        {/* Main Details Card */}
        <Card>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label htmlFor="name">Order Name</Label><Input id="name" value={purchaseDetails.name} onChange={handleDetailChange} /></div>
            <div className="space-y-2"><Label htmlFor="purchase_date">Purchase Date</Label><Input id="purchase_date" type="date" value={purchaseDetails.purchase_date} onChange={handleDetailChange} /></div>
            <div className="space-y-2"><Label htmlFor="status">Status</Label><Select onValueChange={(value) => setPurchaseDetails(p => ({ ...p, status: value }))} value={purchaseDetails.status}><SelectTrigger id="status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Unpaid">Unpaid</SelectItem><SelectItem value="Cancelled">Cancelled</SelectItem></SelectContent></Select></div>
            <div className="md:col-span-2 space-y-2"><Label htmlFor="notes">Notes (Optional)</Label><Textarea id="notes" placeholder="e.g., Supplier name, order number..." value={purchaseDetails.notes} onChange={handleDetailChange} /></div>
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
                    <div className="col-span-6 md:col-span-3 space-y-1"><Label>Item Cost (€)</Label><Input type="number" placeholder="e.g., 25.50" value={item.cost} onChange={(e) => handleItemChange(item.id, 'cost', e.target.value)} /></div>
                    <div className="col-span-12 md:col-span-1 flex justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 mt-4">
                    <div className="space-y-1"><Label>Supplier Name <span className="text-xs text-muted-foreground">(Optional)</span></Label><Input placeholder="e.g., Craft Supplies Co." value={item.supplier_name} onChange={(e) => handleItemChange(item.id, 'supplier_name', e.target.value)} /></div>
                    <div className="space-y-1"><Label>Supplier Contact <span className="text-xs text-muted-foreground">(Optional)</span></Label><Input placeholder="e.g., order #, phone" value={item.supplier_contact} onChange={(e) => handleItemChange(item.id, 'supplier_contact', e.target.value)} /></div>
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
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
