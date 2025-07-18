"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, LucidePlus, LucideInfo } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Material } from '@/storage/materials';
import { MaterialPurchaseStore } from '@/storage/material_purchases';
import { NewSPASassClient } from '@/lib/supabase/client';

interface CreatePurchaseShortcutDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPurchaseCreated: () => void;
  materials: Material[];
}

export function CreatePurchaseShortcutDialog({ isOpen, onOpenChange, onPurchaseCreated, materials }: CreatePurchaseShortcutDialogProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [formData, setFormData] = useState({
    purchase_date: new Date().toISOString().split('T')[0],
    total_cost: '',
    total_quantity: '',
    supplier_name: '',
    supplier_contact: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedMaterial = useMemo(() =>
    materials.find(m => m.id === selectedMaterialId),
    [materials, selectedMaterialId]
  );

  const resetForm = () => {
    setSelectedMaterialId('');
    setFormData({
      purchase_date: new Date().toISOString().split('T')[0],
      total_cost: '',
      total_quantity: '',
      supplier_name: '',
      supplier_contact: '',
    });
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) {
      setError('You must select a material.');
      return;
    }
    if (!formData.purchase_date || !formData.total_cost || !formData.total_quantity) {
      setError('Please fill out all required fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const supabase = await NewSPASassClient();
      const purchaseStore = new MaterialPurchaseStore(supabase);

      await purchaseStore.Create({
        material_id: selectedMaterial.id,
        purchase_date: formData.purchase_date,
        total_cost: parseFloat(formData.total_cost),
        total_quantity: parseFloat(formData.total_quantity) * selectedMaterial.conversion_factor,
        supplier_name: formData.supplier_name,
        supplier_contact: formData.supplier_contact,
      });

      onPurchaseCreated();
      onOpenChange(false);

    } catch (err: any) {
      setError(`Failed to log purchase: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogTrigger asChild>
        <Button className="bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 font-medium">
          <LucidePlus className="h-4 w-4 mr-2" />
          Add New Purchase
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Log a New Purchase</DialogTitle>
          <DialogDescription>
            Select a material and enter the purchase details. This will update its stock.
          </DialogDescription>
        </DialogHeader >

        {
          materials.length === 0 && isOpen && (
            <Alert variant="default" className="bg-amber-50 border-amber-200">
              <LucideInfo className="h-4 w-4" />
              <AlertDescription>
                You must add a material before you can log a purchase.
              </AlertDescription>
            </Alert>
          )
        }

        {
          error && (
            <Alert variant="destructive" className="my-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )
        }

        {materials.length > 0 && (
          <>
            <form id="create-purchase-shortcut-form" onSubmit={handleSubmit} className="grid gap-6 py-4">
              <div>
                <Label htmlFor="material-select">Material</Label>
                <Select onValueChange={setSelectedMaterialId} value={selectedMaterialId}>
                  <SelectTrigger id="material-select">
                    <SelectValue placeholder="Select a material..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map(material => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMaterial && (
                <>
                  <div>
                    <Label htmlFor="purchase_date">Date</Label>
                    <Input id="purchase_date" type="date" value={formData.purchase_date} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="total_quantity">Quantity in {selectedMaterial.purchase_unit}</Label>
                    <Input id="total_quantity" type="number" step="any" placeholder={`e.g., 5 ${selectedMaterial.purchase_unit}`} value={formData.total_quantity} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="total_cost">Total Cost (€)</Label>
                    <Input id="total_cost" type="number" step="any" placeholder="e.g., 50.25" value={formData.total_cost} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="supplier_name" className="text-right">Supplier</Label>
                    <Input id="supplier_name" placeholder="Optional" value={formData.supplier_name} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div>
                    <Label htmlFor="supplier_contact" className="text-right">Contact</Label>
                    <Input id="supplier_contact" placeholder="Optional" value={formData.supplier_contact} onChange={handleInputChange} className="col-span-3" />
                  </div>
                </>
              )}
            </form>

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" form="create-purchase-shortcut-form" disabled={loading || !selectedMaterial}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Purchase
              </Button>
            </DialogFooter>
          </>
        )}

      </DialogContent >
    </Dialog >
  );
}