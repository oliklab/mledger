"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { NewSPASassClient } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Loader2,
  Package,
  Plus,
  AlertTriangle,
  Euro,
  Scale,
  Scissors,
  Calculator,
  ShoppingCart,
  StickyNote,
  LucideDollarSign,
  LucideTablet,
} from 'lucide-react';
import { Material, MaterialStore } from '@/storage/materials';
import { Label } from '@/components/ui/label';
import { HelpText } from '@/components/ui/help-text';
import { useToast } from '@/hooks/use-toast';

// Add New Material Button and Dialog.
// Define props for the component
interface CreateMaterialDialogProps {
  onMaterialCreated: () => Promise<void>; // Callback to refresh the materials list
}

// Use a type for the form state. It's similar to Material but uses strings for inputs.
type MaterialFormState = {
  name: string;
  purchase_unit: string;
  crafting_unit: string;
  conversion_factor: string;
  total_cost: string;
  total_quantity: string;
  minimum_threshold: string;
  notes: string;

  sku: string,
  initial_cost: string,
  initial_quantity: string,
  status: string,
  category: string,
  inventoryable: string,
};

// Define the initial state for the form
const initialFormState: MaterialFormState = {
  name: '',
  purchase_unit: '',
  crafting_unit: '',
  conversion_factor: '',
  total_cost: '',
  total_quantity: '',
  minimum_threshold: '',
  notes: '',
  sku: '',
  initial_cost: '',
  initial_quantity: '',
  status: '',
  category: '',
  inventoryable: '',
};

export function CreateMaterialDialog({ onMaterialCreated }: CreateMaterialDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a single state object for the form
  const [formData, setFormData] = useState<MaterialFormState>(initialFormState);
  const { toast } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setError(null);
  };

  const handleCreateMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // --- Validation ---
    if (!formData.name ||
      !formData.purchase_unit ||
      !formData.crafting_unit ||
      !formData.conversion_factor ||
      !formData.total_cost ||
      !formData.total_quantity) {
      setError('Please fill out all required fields.');
      toast({ variant: "destructive", title: "Error", description: "Please fill out all required fields." });
      return;
    }

    const conversionNum = parseFloat(formData.conversion_factor);
    const costNum = parseFloat(formData.total_cost);
    const quantityNum = parseFloat(formData.total_quantity);

    if (isNaN(conversionNum) || conversionNum <= 0 || isNaN(costNum) || costNum < 0 || isNaN(quantityNum) || quantityNum < 0) {
      setError('Please enter valid positive numbers for factors, costs, and quantities.');
      toast({ variant: "destructive", title: "Error", description: "Please enter valid positive numbers for factors, costs, and quantities." })
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        status: formData.status,
        category: formData.category,
        purchase_unit: formData.purchase_unit,
        crafting_unit: formData.crafting_unit,
        conversion_factor: conversionNum,
        initial_cost: costNum,
        initial_quantity: quantityNum,
        total_cost: costNum,
        total_quantity: quantityNum,
        current_stock: quantityNum,
        minimum_threshold: formData.minimum_threshold ? parseFloat(formData.minimum_threshold) : 0,
        notes: formData.notes,
      } as Material;

      const supabase = await NewSPASassClient();
      const materialStore = new MaterialStore(supabase);
      await materialStore.Create(payload);

      // Success!
      onMaterialCreated();
      setOpen(false);
    } catch (err: any) {
      setError(err.message || 'Err occured creating a new Material');
      toast({ variant: "destructive", title: "Error", description: `Error occured creating a new Material: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 font-medium">
          <Plus className="h-4 w-4 mr-2" />
          Add New Material
        </Button>
      </DialogTrigger>

      <DialogContent className="font-serif sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-8">
          <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
            Add a New Raw Material
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-8 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleCreateMaterial} className="space-y-8">
          <div className="space-y-4">
            <Label htmlFor="name" className="text-base font-semibold text-slate-700 flex items-center gap-2">
              Material Name
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Example: Organic Soy Wax, 100% Merino Wool, Natural Cotton Thread"
              required
              className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
            />
          </div>

          <div className="space-y-4">
            <Label htmlFor="sku" className="text-base font-semibold text-slate-700 flex items-center gap-2">
              Material SKU
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sku"
              type="text"
              value={formData.sku}
              onChange={handleInputChange}
              placeholder="Example: SOY-WAX"
              required
              className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
            />
          </div>

          <div className='grid grid-cols-2 md:grid-cols-2 gap-6'>
            <div className="space-y-4">
              <Label htmlFor="purchase_unit" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Purchase Unit
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="purchase_unit"
                type="text"
                value={formData.purchase_unit}
                onChange={handleInputChange}
                placeholder="Example: kg, roll, skein, yard"
                required
                className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              />
              <HelpText variant='warning'>
                Write the unit of measurement you buy this material. Think about how it is sold from the supplier.
                Example: For 5kg Candle Wax write "kg".
              </HelpText>
            </div>

            <div className="space-y-4">
              <Label htmlFor="crafting_unit" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Crafting Unit
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="crafting_unit"
                type="text"
                value={formData.crafting_unit}
                onChange={handleInputChange}
                placeholder="Example: g, cm, piece, inch"
                required
                className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              />
              <HelpText variant='warning'>
                The unit you measure this item when creating products. We will use this unit in the recipes.
                Example: For 10 g Candle Wax write "g". And the conversion factor below will be 1000.
              </HelpText>
            </div>
          </div>

          <div className="space-y-4">
            <Label htmlFor="conversion_factor" className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Unit Conversion Factor
              <span className="text-red-500">*</span>
            </Label>

            <div className="flex items-center gap-2">
              <div className="text-base font-semibold text-slate-700">
                1 {formData.purchase_unit} =
              </div>
              <Input
                id="conversion_factor"
                type="number"
                step="any"
                value={formData.conversion_factor}
                onChange={handleInputChange}
                placeholder="Example: 1, 1000, 100"
                required
                className="w-80 text-base rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              />
              <div className="text-base font-semibold text-slate-700">
                {formData.crafting_unit}
              </div>
            </div>
            <HelpText variant='warning'>
              How many Crafting unit fit in one purchase unit?
              For example, if purchase unit is 1 kg, the crafting unit is 1000g, enter 1000 here; or 1 roll = 50 cm, enter 50. <br />
              You can use <b><a href="https://www.unitconverters.net/" target="_blank" rel="noopener noreferrer">this website</a></b> to find out the conversion factor.
            </HelpText>
          </div>

          {/* Purchase Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label htmlFor="total_quantity" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Starting Quantity in Crafting Unit
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="total_quantity"
                type="number"
                step="any"
                value={formData.total_quantity}
                onChange={handleInputChange}
                placeholder="Example: 5 (in Crafting Unit)"
                required
                className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              />
              <HelpText variant="success">
                Enter the quantity of the materials you currently have in Crafting Unit, if you have 5 kg, enter "5" here.
              </HelpText>
            </div>

            <div className="space-y-4">
              <Label htmlFor="total_cost" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <LucideDollarSign className="h-4 w-4" />
                Cost of Starting Quantity
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="total_cost"
                type="number"
                step="any"
                value={formData.total_cost}
                onChange={handleInputChange}
                placeholder="Example: 40.00"
                required
                className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              />
              <HelpText variant="success">
                The total amount you paid including shipping, taxes, and any fees. This helps calculate your true material costs.
              </HelpText>
            </div>
          </div>

          <div className="space-y-4">
            <Label htmlFor="minimum_threshold" className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Low Stock Threshold in Craft Unit<span className="text-slate-500 font-normal">(Optional)</span>
            </Label>
            <Input
              id="minimum_threshold"
              type="number"
              step="any"
              value={formData.minimum_threshold}
              onChange={handleInputChange}
              placeholder="Example: 500 (in Crafting Unit)"
              className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
            />
            <HelpText variant="success">
              If you set a value larger than 0, you will get low stock alert when your curent stock goes below this value.
            </HelpText>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <Label htmlFor="notes" className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Notes <span className="text-slate-500 font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Storage: Keep in cool, dry place"
              rows={4}
              className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200 resize-none"
            />
          </div>

          <div className="flex justify-end pt-8 border-t-2 border-slate-100">
            <Button
              disabled={loading}
              className="bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-base font-semibold rounded-lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Saving Material...' : 'Save Material'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
