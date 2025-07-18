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
} from 'lucide-react';
import { Material, MaterialStore } from '@/storage/materials';
import { Label } from '@/components/ui/label';
import { HelpText } from '@/components/ui/help-text';

interface MaterialDialogProps {
  onMaterialPurchaseCreated: () => Promise<void>;
}

export function CreateMaterialPurchaseDialog({ onMaterialPurchaseCreated }: MaterialDialogProps) {
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