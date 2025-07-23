"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { RecipeMetadata, RecipeStore } from '@/storage/recipes';
import { Material, MaterialStore } from '@/storage/materials';

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { ConfirmDeleteDialog } from '@/components/ConfirmDelete';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Utils and Icons
import { FormatCurrency, FormatDate } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  AlertCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Archive,
  Wallet,
  FlaskConical,
  ChefHat,
  Beaker,
  Plus,
  ViewIcon,
  Edit3,
  MoreVertical
} from 'lucide-react';

// Define an enhanced recipe type that includes the calculated cost
type EnhancedRecipeMetadata = RecipeMetadata & {
  calculated_cost: number;
};

export default function RecipesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State Management
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recipes, setRecipes] = useState<RecipeMetadata[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 10;

  // Data Fetching
  const loadData = useCallback(async () => {
    try {
      if (!initialLoading) setLoading(true);
      const supabase = await NewSPASassClient();
      const [recipesData, materialsData] = await Promise.all([
        new RecipeStore(supabase).ReadAllMetadata(),
        new MaterialStore(supabase).ReadAll()
      ]);
      setRecipes(recipesData);
      setMaterials(materialsData);
    } catch (err: any) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, [initialLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create a lookup map for materials for efficient cost calculation
  const materialMap = useMemo(() => new Map(materials.map(m => [m.id, m])), [materials]);

  // Enhance recipes with dynamically calculated cost and filter them
  const enhancedAndFilteredRecipes = useMemo(() => {
    return recipes
      .map(recipeMeta => {
        const totalCost = recipeMeta.materials.reduce((sum, rm) => {
          const material = materialMap.get(rm.material_id);
          return material ? sum + (rm.quantity * material.avg_cost) : sum;
        }, 0);
        return { ...recipeMeta, calculated_cost: totalCost };
      })
      .filter(recipe => {
        const searchLower = searchTerm.toLowerCase();
        return recipe.recipe.name.toLowerCase().includes(searchLower) ||
          (recipe.recipe.notes && recipe.recipe.notes.toLowerCase().includes(searchLower));
      });
  }, [recipes, materialMap, searchTerm]);

  // Analytics Calculations
  const analytics = useMemo(() => {
    const totalCostOfAllRecipes = enhancedAndFilteredRecipes.reduce((sum, r) => sum + r.calculated_cost, 0);
    const avgCost = enhancedAndFilteredRecipes.length > 0 ? totalCostOfAllRecipes / enhancedAndFilteredRecipes.length : 0;
    const totalIngredients = recipes.reduce((sum, r) => sum + r.materials.length, 0);

    return {
      totalRecipes: recipes.length,
      avgCostPerRecipe: FormatCurrency(avgCost),
      totalIngredients,
    };
  }, [recipes, enhancedAndFilteredRecipes]);

  // Pagination
  const totalPages = Math.ceil(enhancedAndFilteredRecipes.length / itemsPerPage);
  const paginatedRecipes = enhancedAndFilteredRecipes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handlers
  const handleConfirmDelete = async () => {
    if (!selectedRecipe) return;
    setIsDeleting(true);
    try {
      const supabase = await NewSPASassClient();
      await new RecipeStore(supabase).Delete(selectedRecipe.id);
      toast({ title: "Recipe Deleted", description: `"${selectedRecipe.name}" has been removed.` });
      loadData(); // Refresh list
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete the recipe." });
    } finally {
      setIsDeleting(false);
      setSelectedRecipe(null);
    }
  };

  const RecipeCard = ({ recipeMeta }: { recipeMeta: EnhancedRecipeMetadata }) => {
    const { recipe, materials: recipeItems, calculated_cost } = recipeMeta;
    return (
      <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-300">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="p-3 bg-slate-100 rounded-lg hidden sm:block">
              <ChefHat className="h-6 w-6 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/app/recipes/${recipe.id}`} className="group">
                <h3 className="text-base font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                  {recipe.name}
                </h3>
              </Link>
              <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                Yields: {recipe.yield_quantity} {recipe.yield_unit || 'unit(s)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center hidden sm:block">
              <p className="text-xs font-medium text-slate-500">Total Cost</p>
              <p className="text-lg font-bold text-slate-800">{FormatCurrency(calculated_cost)}</p>
            </div>
            <div className="text-center hidden md:block">
              <p className="text-xs font-medium text-slate-500">Cost/Yield</p>
              <p className="text-lg font-bold text-slate-800">{FormatCurrency(calculated_cost / recipe.yield_quantity)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-slate-500">Ingredients</p>
              <p className="text-lg font-bold text-slate-800">{recipeItems.length}</p>
            </div>
            <div className="border-l pl-2 ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => router.push(`/app/recipes/${recipe.id}`)}><ViewIcon className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push(`/app/recipes/${recipe.id}/edit`)}><Edit3 className="mr-2 h-4 w-4" />Edit Recipe</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { setSelectedRecipe({ id: recipe.id, name: recipe.name }); setIsDeleteDialogOpen(true); }} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete Recipe</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (initialLoading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-primary-600" /></div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <ConfirmDeleteDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={handleConfirmDelete} itemName={selectedRecipe?.name || "this recipe"} isDeleting={isDeleting} />

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Recipes</h1>
          <p className="mt-2 text-base text-gray-600 max-w-2xl">
            Your collection of formulas for creating products.<br />
            Recipes are your product building blocks. It represents what are the materials used and how much to build a product. It will help Track the ingredients and calculate product costs dynamically.
          </p>
        </div>
        <div className="flex items-center shrink-0 gap-2 mt-4 md:mt-0">
          <Button asChild className="bg-primary-600 text-white hover:bg-primary-700">
            <Link href="/app/recipes/new"><Plus className="h-4 w-4 mr-2" />New Recipe</Link>
          </Button>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {/* --- ANALYTICS --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnalyticsCard title="Total Recipes" value={analytics.totalRecipes.toString()} icon={FlaskConical} description="The total number of unique recipes you have created." />
        <AnalyticsCard title="Avg. Cost per Recipe" value={analytics.avgCostPerRecipe} icon={Wallet} description="The average material cost to produce one batch of a recipe." />
        <AnalyticsCard title="Total Ingredients Used" value={analytics.totalIngredients.toString()} icon={Beaker} description="The total number of material line items across all recipes." />
      </div>

      {/* --- RECIPE LIST --- */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search recipes by name or notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 relative">
            {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm z-10 rounded-lg"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>}
            {paginatedRecipes.length > 0 ? (
              paginatedRecipes.map((recipeMeta) => <RecipeCard key={recipeMeta.recipe.id} recipeMeta={recipeMeta} />)
            ) : (
              <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg">
                <Archive className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">{searchTerm ? 'No Recipes Found' : 'Your Cookbook is Empty'}</h3>
                <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Try adjusting your search.' : 'Get started by creating your first recipe.'}</p>
              </div>
            )}
          </div>
        </CardContent>
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Showing {paginatedRecipes.length} of {enhancedAndFilteredRecipes.length} recipes</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}