import { SaasClient } from "@/lib/supabase/saas";
import { AuthStore } from "@/storage/auth";

/**
 * Represents a recipe record from the 'recipes' table.
 */
export type Recipe = {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  yield_quantity: number;
  yield_unit: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Represents a single material line item within a recipe.
 */
export type RecipeMaterial = {
  id: string;
  recipe_id: string;
  material_id: string;
  quantity: number;
  details: string;
};

/**
 * A composite type that holds the main recipe and all its material line items.
 * This is the primary data structure the UI will work with.
 */
export type RecipeMetadata = {
  recipe: Recipe;
  materials: RecipeMaterial[];
};

/**
 * Defines the shape of the data needed to create a new recipe.
 */
type CreateRecipePayload = {
  name: string;
  notes: string | null;
  yield_quantity: number;
  yield_unit: string | null;
  materials: Omit<RecipeMaterial, 'id' | 'recipe_id'>[];
};

export class RecipeStore {
  private store: SaasClient;
  private auth: AuthStore;

  constructor(saas: SaasClient) {
    this.store = saas;
    this.auth = new AuthStore(saas);
  }

  /**
   * Creates a new recipe and its associated material line items.
   * This is not a true atomic transaction and involves multiple DB calls.
   * It attempts to clean up if an error occurs midway.
   * @param model The payload containing the recipe details and materials list.
   * @returns The newly created parent recipe object.
   */
  async Create(model: CreateRecipePayload): Promise<Recipe> {
    const supabase = this.store.SupabaseClient();
    const userId = await this.auth.GetAuthenticatedUserId();

    // Step 1: Insert the parent 'recipes' record.
    const { data: newRecipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: userId,
        name: model.name,
        notes: model.notes,
        yield_quantity: model.yield_quantity,
        yield_unit: model.yield_unit,
      })
      .select()
      .single();

    if (recipeError) {
      console.error("Error creating parent recipe:", recipeError);
      throw recipeError;
    }

    // Step 2: Insert the associated 'recipe_materials' line items.
    const materialsToInsert = model.materials.map(material => ({
      recipe_id: newRecipe.id,
      material_id: material.material_id,
      quantity: material.quantity,
      details: material.details,
    }));

    const { error: materialsError } = await supabase
      .from('recipe_materials')
      .insert(materialsToInsert);

    if (materialsError) {
      // If line items fail, attempt to roll back the parent recipe creation.
      console.error("Error inserting recipe materials. Rolling back...", materialsError);
      await supabase.from('recipes').delete().eq('id', newRecipe.id);
      throw materialsError;
    }

    return newRecipe;
  }

  /**
   * Reads a single recipe and its associated materials.
   * @param id The UUID of the recipe.
   * @returns A RecipeMetadata object.
   */
  async ReadMetadata(id: string): Promise<RecipeMetadata> {
    const { data: recipe, error: recipeError } = await this.store.SupabaseClient()
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (recipeError) throw recipeError;

    const { data: materials, error: materialsError } = await this.store.SupabaseClient()
      .from('recipe_materials')
      .select('*')
      .eq('recipe_id', id);

    if (materialsError) throw materialsError;

    return { recipe, materials: materials || [] };
  }

  /**
   * Reads all recipes for the authenticated user, along with all their materials.
   * This is optimized to prevent N+1 query problems.
   * @returns An array of RecipeMetadata objects.
   */
  async ReadAllMetadata(): Promise<RecipeMetadata[]> {
    const supabase = this.store.SupabaseClient();
    const userId = await this.auth.GetAuthenticatedUserId();

    // Step 1: Fetch all recipes for the user.
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (recipesError) throw recipesError;
    if (!recipes || recipes.length === 0) return [];

    // Step 2: Fetch all recipe materials for those recipes in a single query.
    const recipeIds = recipes.map(r => r.id);
    const { data: allMaterials, error: materialsError } = await supabase
      .from('recipe_materials')
      .select('*')
      .in('recipe_id', recipeIds);

    if (materialsError) throw materialsError;

    // Step 3: Map the materials to their parent recipes in TypeScript.
    const materialsByRecipeId = new Map<string, RecipeMaterial[]>();
    allMaterials?.forEach(material => {
      const existing = materialsByRecipeId.get(material.recipe_id) || [];
      existing.push(material);
      materialsByRecipeId.set(material.recipe_id, existing);
    });

    return recipes.map(recipe => ({
      recipe,
      materials: materialsByRecipeId.get(recipe.id) || []
    }));
  }

  /**
   * Updates a recipe's details and replaces its material list.
   * This uses a "delete-then-insert" strategy for line items to simplify the logic.
   * @param id The UUID of the recipe to update.
   * @param model The payload with the updated data.
   */
  async Update(id: string, model: CreateRecipePayload) {
    const supabase = this.store.SupabaseClient();
    const userId = await this.auth.GetAuthenticatedUserId();

    // Step 1: Update the parent recipe's details
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        name: model.name,
        notes: model.notes,
        yield_quantity: model.yield_quantity,
        yield_unit: model.yield_unit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Step 2: Delete all existing line items for this recipe
    const { error: deleteError } = await supabase
      .from('recipe_materials')
      .delete()
      .eq('recipe_id', id);

    if (deleteError) throw deleteError;

    // Step 3: Insert the new set of line items
    if (model.materials.length > 0) {
      const materialsToInsert = model.materials.map(material => ({
        recipe_id: id,
        material_id: material.material_id,
        quantity: material.quantity,
        details: material.details,
      }));

      const { error: insertError } = await supabase
        .from('recipe_materials')
        .insert(materialsToInsert);

      if (insertError) throw insertError;
    }
  }

  /**
   * Deletes a recipe. The database's `ON DELETE CASCADE` rule will
   * automatically delete all associated recipe_materials.
   * @param id The UUID of the recipe to delete.
   */
  async Delete(id: string) {
    const { error } = await this.store.SupabaseClient()
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}