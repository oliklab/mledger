"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { MaterialPurchase, MaterialPurchaseStore } from '@/storage/material_purchases';
import { NewSPASassClient } from '@/lib/supabase/client';

interface EditPurchaseDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPurchaseUpdated: () => Promise<void>;
  purchase: MaterialPurchase | null;
  materialName: string;
  purchaseUnit: string;
  conversionFactor: number;
}

export function EditPurchaseDialog({ isOpen, onOpenChange, onPurchaseUpdated, purchase, materialName, purchaseUnit, conversionFactor }: EditPurchaseDialogProps) {
  const [formData, setFormData] = useState({
    purchase_date: '',
    total_cost: '',
    total_quantity: '',
    supplier_name: '',
    supplier_contact: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (purchase) {
      setFormData({
        purchase_date: purchase.purchase_date,
        total_cost: String(purchase.total_cost),
        // Convert quantity from crafting unit back to purchase unit for the form
        total_quantity: String(purchase.total_quantity / conversionFactor),
        supplier_name: purchase.supplier_name || '',
        supplier_contact: purchase.supplier_contact || '',
      });
    }
  }, [purchase, isOpen, conversionFactor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchase) return;
    setError('');

    if (!formData.purchase_date || !formData.total_cost || !formData.total_quantity) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    try {
      const supabase = await NewSPASassClient();
      const purchaseStore = new MaterialPurchaseStore(supabase);

      await purchaseStore.Update({
        id: purchase.id,
        purchase_date: formData.purchase_date,
        total_cost: parseFloat(formData.total_cost),
        // Convert quantity back to crafting unit for the database
        total_quantity: parseFloat(formData.total_quantity) * conversionFactor,
        supplier_name: formData.supplier_name,
        supplier_contact: formData.supplier_contact,
      });

      await onPurchaseUpdated();
      onOpenChange(false);

    } catch (err: any) {
      setError(`Failed to update purchase: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Purchase for {materialName}</DialogTitle>
          <DialogDescription>
            Modify the details of this purchase. Changes will be reflected in the material's stock and cost.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form id="edit-purchase-form" onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="purchase_date" className="text-right">Date</Label>
            <Input id="purchase_date" type="date" value={formData.purchase_date} onChange={handleInputChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="total_quantity" className="text-right">Quantity in {purchaseUnit}</Label>
            <Input id="total_quantity" type="number" step="any" value={formData.total_quantity} onChange={handleInputChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="total_cost" className="text-right">Total Cost</Label>
            <Input id="total_cost" type="number" step="any" value={formData.total_cost} onChange={handleInputChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier_name" className="text-right">Supplier</Label>
            <Input id="supplier_name" value={formData.supplier_name} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier_contact" className="text-right">Contact</Label>
            <Input id="supplier_contact" value={formData.supplier_contact} onChange={handleInputChange} className="col-span-3" />
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" form="edit-purchase-form" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}