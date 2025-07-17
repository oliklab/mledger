"use client";

import React, { useState, useEffect } from 'react';
import { UseUserContext } from '@/lib/context/GlobalContext';
import { NewSPASassClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
  Plus,
  AlertCircle,
  Loader2,
  Package,
  HelpCircle,
  Scale,
  Scissors,
  Calculator,
  ShoppingCart,
  Euro,
  AlertTriangle,
  StickyNote
} from 'lucide-react';
import Confetti from '@/components/Confetti';
import { Material, MaterialStore } from '@/storage/materials';
import { Label } from '@/components/ui/label';
import { HelpText } from '@/components/ui/help-text';

interface MaterialDialogProps {
  onTaskCreated: () => Promise<void>;
}

function CreateMaterialPurchaseDialog({ onTaskCreated }: MaterialDialogProps) {
  const { user } = UseUserContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary-600 text-white hover:bg-primary-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Purchase Record
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Purchase</DialogTitle>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleAddTask} className="space-y-4">
          <div className="space-y-2">
            {/* <Input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>
          <div className="space-y-2">
            <Textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Task description (optional)"
              rows={3}
            />
          </div> */}
            {/* <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm">Mark as urgent</span>
              </label> */}
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary-600 text-white hover:bg-primary-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MaterialsPage() {
  const { user } = UseUserContext();
  // const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  useEffect(() => {
    if (user?.id) {
      loadTasks();
    }
  }, [filter, user?.id]);

  const loadTasks = async (): Promise<void> => {
    try {
      const isFirstLoad = initialLoading;
      if (!isFirstLoad) setLoading(true);

      const supabase = await NewSPASassClient();
      const { data, error: supabaseError } = await supabase.getMyTodoList(1, 100, 'created_at', filter);

      if (supabaseError) throw supabaseError;
      //setTasks(data || []);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handleRemoveTask = async (id: number): Promise<void> => {
    try {
      const supabase = await NewSPASassClient();
      const { error: supabaseError } = await supabase.removeTask(id.toString());
      if (supabaseError) throw supabaseError;
      await loadTasks();
    } catch (err) {
      setError('Failed to remove task');
      console.error('Error removing task:', err);
    }
  };

  const handleMarkAsDone = async (id: number): Promise<void> => {
    try {
      const supabase = await NewSPASassClient();
      const { error: supabaseError } = await supabase.updateAsDone(id.toString());
      if (supabaseError) throw supabaseError;
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);

      await loadTasks();
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 p-6 border-b">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
              Your Material Storeroom
            </CardTitle>
            <CardDescription className="mt-2">
              This is your digital storeroom.<br />
              See every raw material you own, from current stock to the average cost you've paid. Add new materials, log your latest<br />
              supply run, or update details anytime. Keeping this accurate is the first step to pricing your products with confidence.
            </CardDescription>
          </div>

          <div className="flex items-center shrink-0 gap-2 mt-4 md:mt-0">
            <CreateMaterialDialog onMaterialCreated={loadTasks} />
            <CreateMaterialPurchaseDialog onTaskCreated={loadTasks} />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <br />
          <div className="mb-6 flex gap-2">
            <Button
              variant={filter === null ? "default" : "secondary"}
              onClick={() => setFilter(null)}
              size="sm"
              className={filter === null ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
            >
              All Tasks
            </Button>
            <Button
              variant={filter === false ? "default" : "secondary"}
              onClick={() => setFilter(false)}
              size="sm"
              className={filter === false ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
            >
              Active
            </Button>
            <Button
              variant={filter === true ? "default" : "secondary"}
              onClick={() => setFilter(true)}
              size="sm"
              className={filter === true ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
            >
              Completed
            </Button>
          </div>

          <div className="space-y-3 relative">
            {loading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            )}

            {/* {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tasks found</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg transition-colors ${task.done ? 'bg-muted' : 'bg-card'
                    } ${task.urgent && !task.done ? 'border-red-200' : 'border-border'
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Created: {new Date(task.created_at).toLocaleDateString()}
                        </span>
                        {task.urgent && !task.done && (
                          <span className="px-2 py-0.5 text-xs bg-red-50 text-red-600 rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!task.done && (
                        <Button
                          onClick={() => handleMarkAsDone(task.id)}
                          variant="ghost"
                          size="icon"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handleRemoveTask(task.id)}
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )} */}
          </div>
        </CardContent>
      </Card>
      <Confetti active={showConfetti} />
    </div>
  );
}

// Add New Material Button and Dialog.
// Define props for the component
interface CreateMaterialDialogProps {
  onMaterialCreated: () => void; // Callback to refresh the materials list
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
};

export function CreateMaterialDialog({ onMaterialCreated }: CreateMaterialDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a single state object for the form
  const [formData, setFormData] = useState<MaterialFormState>(initialFormState);

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
    if (!formData.name || !formData.purchase_unit || !formData.crafting_unit || !formData.conversion_factor || !formData.total_cost || !formData.total_quantity) {
      setError('Please fill out all required fields.');
      return;
    }

    const conversionNum = parseFloat(formData.conversion_factor);
    const costNum = parseFloat(formData.total_cost);
    const quantityNum = parseFloat(formData.total_quantity);

    if (isNaN(conversionNum) || conversionNum <= 0 || isNaN(costNum) || costNum < 0 || isNaN(quantityNum) || quantityNum <= 0) {
      setError('Please enter valid positive numbers for factors, costs, and quantities.');
      return;
    }

    setLoading(true);

    try {
      const supabase = await NewSPASassClient();
      const materialStore = new MaterialStore(supabase);
      const payload = {
        name: formData.name,
        purchase_unit: formData.purchase_unit,
        crafting_unit: formData.crafting_unit,
        conversion_factor: conversionNum,
        total_cost: costNum,
        total_quantity: quantityNum,
        current_stock: quantityNum,
        minimum_threshold: formData.minimum_threshold ? parseFloat(formData.minimum_threshold) : 0,
        notes: formData.notes,
      } as Material;
      await materialStore.Create(payload);

      // Success!
      onMaterialCreated();
      setOpen(false);
    } catch (err: any) {
      setError(err.message || 'Err occured creating a new Material');
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

      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
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

        <div className="space-y-8">
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
              placeholder="Organic Soy Wax, 100% Merino Wool, Natural Cotton Thread"
              required
              className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                placeholder="kg, roll, skein, yard..."
                required
                className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              />
              <HelpText variant='warning'>
                Write the unit of measurement you buy this material in. Think about how it is sold from the supplier. Example: 5 kg Candle Wax.
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
                placeholder="g, cm, piece, inch..."
                required
                className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              />
              <HelpText variant='warning'>
                The unit you measure this item when creating products. We will use this unit in the recipes. Example: 10 g Candle Wax.
              </HelpText>
            </div>

            <div className="space-y-4">
              <Label htmlFor="conversion_factor" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Unit Conversion Factor
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="conversion_factor"
                type="number"
                step="any"
                value={formData.conversion_factor}
                onChange={handleInputChange}
                placeholder="1000, 100, 1..."
                required
                className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              />
              <HelpText variant='warning'>
                How many Crafting unit fit in one purchase unit?<br />
                1 kg = 1000 g, so enter 1000 or 1 roll = 50 cm, so enter 50. <br />
                You can use <b><a href="https://www.unitconverters.net/" target="_blank" rel="noopener noreferrer">this website</a></b> to find out the conversion factor.
              </HelpText>
            </div>
          </div>

          {/* Purchase Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label htmlFor="total_quantity" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Initial Purchase Quantity
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="total_quantity"
                type="number"
                step="any"
                value={formData.total_quantity}
                onChange={handleInputChange}
                placeholder="5"
                required
                className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              />
              <HelpText variant="success">
                Enter the quantity you currently have, if you have 5 kg, enter "5" here.
              </HelpText>
            </div>

            <div className="space-y-4">
              <Label htmlFor="total_cost" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Total Cost Price for Quantity
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="total_cost"
                type="number"
                step="any"
                value={formData.total_cost}
                onChange={handleInputChange}
                placeholder="40.00"
                required
                className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              />
              <HelpText variant="success">
                The total amount you paid including shipping, taxes, and any fees. This helps calculate your true material costs.
              </HelpText>
            </div>
          </div>

          {/* Low Stock Threshold */}
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
              placeholder="500 in Crafting Unit"
              className="text-base py-3 px-4 rounded-lg border-2 border-slate-200 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
            />
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
              onClick={handleCreateMaterial}
              disabled={loading}
              className="bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-base font-semibold rounded-lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Saving Material...' : 'Save Material'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}