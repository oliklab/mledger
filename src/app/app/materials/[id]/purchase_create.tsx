"use client";

import React, { useState } from 'react';
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
import { Loader2, AlertCircle, ShoppingCart, User, Phone, Euro } from 'lucide-react';
import { MaterialPurchaseStore } from '@/storage/material_purchases';
import { NewSPASassClient } from '@/lib/supabase/client';

interface CreatePurchaseDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPurchaseCreated: () => Promise<void>;
  materialId: string;
  materialName: string;
  craftingUnit: string;
  purchaseUnit: string;
  conversionFactor: number;
}

export function CreatePurchaseDialog(input: CreatePurchaseDialogProps) {
  const [formData, setFormData] = useState({
    purchase_date: new Date().toISOString().split('T')[0], // Default to today
    total_cost: '',
    total_quantity: '',
    supplier_name: '',
    supplier_contact: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const resetForm = () => {
    setFormData({
      purchase_date: new Date().toISOString().split('T')[0],
      total_cost: '',
      total_quantity: '',
      supplier_name: '',
      supplier_contact: '',
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.purchase_date || !formData.total_cost || !formData.total_quantity) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    try {
      const supabase = await NewSPASassClient();
      const purchaseStore = new MaterialPurchaseStore(supabase);

      await purchaseStore.Create({
        material_id: input.materialId,
        purchase_date: formData.purchase_date,
        total_cost: parseFloat(formData.total_cost),
        total_quantity: parseFloat(formData.total_quantity) * input.conversionFactor,
        supplier_name: formData.supplier_name,
        supplier_contact: formData.supplier_contact,
      });

      await input.onPurchaseCreated();
      input.onOpenChange(false); // Close the dialog on success

    } catch (err: any) {
      setError(`Failed to log purchase: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={input.isOpen} onOpenChange={(open) => {
      if (!open) resetForm();
      input.onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Record New Purchase <br />Material Name:  {input.materialName}</DialogTitle>
          <DialogDescription>
            This will update the material's stock and average cost.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form id="create-purchase-form" onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="purchase_date" className="text-right">Date</Label>
            <Input id="purchase_date" type="date" value={formData.purchase_date} onChange={handleInputChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="total_quantity" className="text-right">Quantity in {input.purchaseUnit} </Label>
            <Input id="total_quantity" type="number" step="any" placeholder="Example: 2 (Will be Automatically converted to Crafting Unit)" value={formData.total_quantity} onChange={handleInputChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="total_cost" className="text-right">Total Cost</Label>
            <Input id="total_cost" type="number" step="any" placeholder="Example: 50.25" value={formData.total_cost} onChange={handleInputChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier_name" className="text-right">Supplier</Label>
            <Input id="supplier_name" placeholder="Optional" value={formData.supplier_name} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier_contact" className="text-right">Contact</Label>
            <Input id="supplier_contact" placeholder="Optional" value={formData.supplier_contact} onChange={handleInputChange} className="col-span-3" />
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" form="create-purchase-form" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}