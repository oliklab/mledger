"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { RecipeMetadata, RecipeStore } from '@/storage/recipes';
import { Material, MaterialStore } from '@/storage/materials';

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConfirmDeleteDialog } from "@/components/ConfirmDelete";

// Utils and Icons
import { FormatCurrency, FormatDate } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  Edit3,
  Trash2,
  AlertCircle,
  Wallet,
  CalendarClock,
  FlaskConical,
  Beaker,
  StickyNote,
  ChefHat,
  AlertTriangle
} from 'lucide-react';

// Stat Card Sub-component
const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default function RecipeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // Data State
  const [recipeMeta, setRecipeMeta] = useState<RecipeMetadata | null>(null);
  const [materials, setMaterials] = useState<Map<string, Material>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Data Fetching
  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const supabase = await NewSPASassClient();
      const [metaData, materialsData] = await Promise.all([
        new RecipeStore(supabase).ReadMetadata(id),
        new MaterialStore(supabase).ReadAll()
      ]);
      setRecipeMeta(metaData);
      setMaterials(new Map(materialsData.map(m => [m.id, m])));
    } catch (err: any) {
      setError('Failed to load recipe details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dynamic Cost Calculation
  const calculatedTotalCost = useMemo(() => {
    if (!recipeMeta) return 0;
    return recipeMeta.materials.reduce((sum, rm) => {
      const material = materials.get(rm.material_id);
      return material ? sum + (rm.quantity * material.avg_cost) : sum;
    }, 0);
  }, [recipeMeta, materials]);

  const costPerYield = useMemo(() => {
    if (!recipeMeta || !recipeMeta.recipe.yield_quantity) return 0;
    return calculatedTotalCost / recipeMeta.recipe.yield_quantity;
  }, [calculatedTotalCost, recipeMeta]);

  // Handler for Deletion
  const handleConfirmDelete = async () => {
    if (!recipeMeta) return;
    setIsDeleting(true);
    try {
      const supabase = await NewSPASassClient();
      await new RecipeStore(supabase).Delete(recipeMeta.recipe.id);
      toast({ title: "Recipe Deleted", description: "The recipe and its details have been removed." });
      router.push('/app/recipes');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete the recipe." });
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 space-y-6"><Skeleton className="h-10 w-1/2" /><div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div><Skeleton className="h-64" /></div>;
  }
  if (error) {
    return <div className="p-8 text-center"><AlertCircle className="mx-auto h-12 w-12 text-destructive" /><h2 className="mt-4 text-xl">An Error Occurred</h2><p className="text-muted-foreground">{error}</p></div>
  }
  if (!recipeMeta) {
    return <div className="p-8 text-center"><p>Recipe not found.</p></div>
  }

  const { recipe, materials: lineItems } = recipeMeta;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <ConfirmDeleteDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={handleConfirmDelete} itemName={`the recipe "${recipe.name}"`} isDeleting={isDeleting} />

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-2 pl-0 text-muted-foreground hover:text-primary"><Link href="/app/recipes"><ArrowLeft className="h-4 w-4 mr-2" />Back to Recipes</Link></Button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{recipe.name}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" asChild><Link href={`/app/recipes/${id}/edit`}><Edit3 className="mr-2 h-4 w-4" />Edit Recipe</Link></Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Delete Recipe</Button>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Material Cost" value={FormatCurrency(calculatedTotalCost)} icon={Wallet} />
        <StatCard title="Cost per Yield" value={FormatCurrency(costPerYield)} icon={ChefHat} />
        <StatCard title="Yield" value={`${recipe.yield_quantity} ${recipe.yield_unit || 'unit(s)'}`} icon={FlaskConical} />
        <StatCard title="Ingredients" value={lineItems.length} icon={Beaker} />
      </div>

      {/* --- INGREDIENTS TABLE --- */}
      <Card>
        <CardHeader><CardTitle>Ingredients</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Quantity Required</TableHead>
                <TableHead className="text-right">Current Avg. Cost</TableHead>
                <TableHead className="text-right">Line Item Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map(item => {
                const material = materials.get(item.material_id);
                if (!material) {
                  return (
                    <TableRow key={item.id} className="bg-destructive/10">
                      <TableCell colSpan={4} className="text-destructive font-medium">This ingredient was deleted from your storeroom.</TableCell>
                    </TableRow>
                  );
                }
                const isLowStock = material.current_stock <= material.minimum_threshold;
                const lineCost = item.quantity * material.avg_cost;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{material.name}</span>
                        {isLowStock && <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Low Stock</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{item.details || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity.toLocaleString()} {material.crafting_unit}</TableCell>
                    <TableCell className="text-right">{FormatCurrency(material.avg_cost)} / {material.crafting_unit}</TableCell>
                    <TableCell className="text-right font-semibold">{FormatCurrency(lineCost)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- NOTES --- */}
      {recipe.notes && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><StickyNote className="h-5 w-5" />Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{recipe.notes}</p></CardContent>
        </Card>
      )}
    </div>
  );
}