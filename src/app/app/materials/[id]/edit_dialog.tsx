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
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";
import { HelpText } from '@/components/ui/help-text';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  AlertCircle,
  Package,
  Scale,
  Scissors,
  Calculator,
  AlertTriangle,
  StickyNote
} from 'lucide-react';
import { Material, MaterialStore } from '@/storage/materials';
import { NewSPASassClient } from '@/lib/supabase/client';

interface EditMaterialDialogProps {
  material: Material;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onMaterialUpdated: (name: string) => void;
}

// 👇 Use a more detailed form state, similar to the create dialog
type EditMaterialFormState = {
  name: string;
  purchase_unit: string;
  crafting_unit: string;
  conversion_factor: string;
  minimum_threshold: string;
  notes: string;
};

export function EditMaterialDialog({ material, isOpen, onOpenChange, onMaterialUpdated }: EditMaterialDialogProps) {
  const [formData, setFormData] = useState<EditMaterialFormState>({
    name: '',
    purchase_unit: '',
    crafting_unit: '',
    conversion_factor: '1',
    minimum_threshold: '0',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 👇 Sync form state when the material prop changes or the dialog opens
  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        purchase_unit: material.purchase_unit,
        crafting_unit: material.crafting_unit,
        conversion_factor: String(material.conversion_factor),
        minimum_threshold: String(material.minimum_threshold),
        notes: material.notes || '',
      });
    }
  }, [material, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // 👇 Updated submit handler with validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.purchase_unit || !formData.crafting_unit || !formData.conversion_factor) {
      setError('Please fill out all required fields.');
      return;
    }

    const conversionNum = parseFloat(formData.conversion_factor);
    if (isNaN(conversionNum) || conversionNum <= 0) {
      setError('Conversion factor must be a positive number.');
      return;
    }

    setLoading(true);

    try {
      const supabase = await NewSPASassClient();
      const payload = {
        ...material, // Keep original data like ID and timestamps
        ...formData, // Overwrite with new form data
        conversion_factor: conversionNum,
        minimum_threshold: parseFloat(formData.minimum_threshold) || 0,
      };

      await new MaterialStore(supabase).Update(payload);
      onMaterialUpdated(payload.name); // Refresh the details on the parent page
      onOpenChange(false); // Close the dialog
    } catch (err: any) {
      setError('Failed to update material: ' + err.message);
      console.error('Error updating material:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="font-serif sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
            Edit Material
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            Update the core details of your material here. Changes will be reflected across your inventory and recipes.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-base font-semibold text-slate-700">Material Name <span className="text-red-500">*</span></Label>
            <Input id="name" value={formData.name} onChange={handleInputChange} required className="text-base py-3 px-4" />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className="space-y-3">
              <Label htmlFor="purchase_unit" className="text-base font-semibold text-slate-700 flex items-center gap-2"><Scale className="h-4 w-4" />Purchase Unit <span className="text-red-500">*</span></Label>
              <Input id="purchase_unit" value={formData.purchase_unit} onChange={handleInputChange} required className="text-base py-3 px-4" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="crafting_unit" className="text-base font-semibold text-slate-700 flex items-center gap-2"><Scissors className="h-4 w-4" />Crafting Unit <span className="text-red-500">*</span></Label>
              <Input id="crafting_unit" value={formData.crafting_unit} onChange={handleInputChange} required className="text-base py-3 px-4" />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="conversion_factor" className="text-base font-semibold text-slate-700 flex items-center gap-2"><Calculator className="h-4 w-4" />Unit Conversion Factor <span className="text-red-500">*</span></Label>
            <Input id="conversion_factor" type="number" step="any" value={formData.conversion_factor} onChange={handleInputChange} required className="text-base py-3 px-4" />
            <HelpText variant='warning'>How many Crafting Units fit in one Purchase Unit? (e.g., 1 kg = 1000 g, so enter 1000).</HelpText>
          </div>

          <div className="space-y-3">
            <Label htmlFor="minimum_threshold" className="text-base font-semibold text-slate-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Low Stock Threshold <span className="text-slate-500 font-normal">(Optional)</span></Label>
            <Input id="minimum_threshold" type="number" step="any" value={formData.minimum_threshold} onChange={handleInputChange} className="text-base py-3 px-4" />
            <HelpText>You'll get a "Low Stock" alert when inventory drops to this number.</HelpText>
          </div>

          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-semibold text-slate-700 flex items-center gap-2"><StickyNote className="h-4 w-4" />Notes <span className="text-slate-500 font-normal">(Optional)</span></Label>
            <Textarea id="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="text-base py-3 px-4 resize-none" />
          </div>

          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}