import { SaasClient } from "@/lib/supabase/saas";
import { AuthStore } from "@/storage/auth";

/**
 * Represents a sellable product from the 'products' table.
 */
export type Product = {
  id: string;
  user_id: string;
  name: string;
  sku: string | null;
  recipe_id: string;
  selling_price: number | null;
  current_stock: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Represents a historical record of a manufacturing event from the 'product_builds' table.
 */
export type ProductBuild = {
  id: string;
  user_id: string;
  product_id: string;
  recipe_id: string;
  quantity_built: number;
  total_cost_at_build: number;
  notes: string | null;
  created_at: string;
};

export type ProductSalesHistory = {
  sale_id: string;
  sale_date: string;
  customer_details: string | null;
  quantity_sold: number;
  price_per_unit: number;
  subtotal: number;
};

export class ProductStore {
  private store: SaasClient;
  private auth: AuthStore;

  constructor(saas: SaasClient) {
    this.store = saas;
    this.auth = new AuthStore(saas);
  }

  // --- Product CRUD Operations ---

  /**
   * Creates a new product.
   * @param model A partial Product object containing the necessary creation data.
   */
  async Create(model: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_stock'>): Promise<Product> {
    const { data, error } = await this.store.SupabaseClient()
      .from('products')
      .insert({
        ...model,
        user_id: await this.auth.GetAuthenticatedUserId(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Reads a single product by its ID.
   * @param id The UUID of the product.
   */
  async Read(id: string): Promise<Product> {
    const { data, error } = await this.store.SupabaseClient()
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('user_id', await this.auth.GetAuthenticatedUserId())
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Reads all products for the authenticated user.
   */
  async ReadAll(): Promise<Product[]> {
    const { data, error } = await this.store.SupabaseClient()
      .from('products')
      .select('*')
      .eq('user_id', await this.auth.GetAuthenticatedUserId())
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Updates a product's core details (e.g., name, price). Does not affect stock.
   * @param model A partial Product object with the fields to update.
   */
  async Update(model: Pick<Product, 'id' | 'name' | 'sku' | 'selling_price' | 'notes' | 'recipe_id'>) {
    const { data, error } = await this.store.SupabaseClient()
      .from('products')
      .update({
        name: model.name,
        sku: model.sku,
        selling_price: model.selling_price,
        notes: model.notes,
        recipe_id: model.recipe_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', model.id);

    if (error) throw error;
    return data;
  }

  /**
   * Deletes a product. Note: The database schema's ON DELETE CASCADE will handle deleting associated builds.
   * @param id The UUID of the product to delete.
   */
  async Delete(id: string) {
    const { error } = await this.store.SupabaseClient()
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async DeleteWithStockManagement(productId: string, returnStock: boolean): Promise<void> {
    const { error } = await this.store.SupabaseClient().rpc('delete_product_and_manage_stock', {
      p_product_id: productId,
      p_return_stock: returnStock
    });

    if (error) {
      console.error("Error calling delete_product_and_manage_stock RPC:", error);
      throw error;
    }
  }


  // --- Product Build Operations (RPC Calls) ---

  /**
   * Calls the transactional SQL function to log a new product build,
   * updating product and material stock levels atomically.
   * @param productId The UUID of the product being built.
   * @param quantity The number of products being built.
   * @param notes Optional notes for the build log.
   */
  async logBuild(productId: string, quantity: number, notes?: string) {
    const { error } = await this.store.SupabaseClient()
      .rpc('log_product_build', {
        p_product_id: productId,
        p_quantity_built: quantity,
        p_notes: notes,
      });

    if (error) throw error;
  }

  /**
   * Calls the transactional SQL function to delete a product build,
   * reverting all associated stock changes atomically.
   * @param buildId The UUID of the build log entry to delete.
   */
  async deleteBuild(buildId: string) {
    const { error } = await this.store.SupabaseClient()
      .rpc('delete_product_build', {
        p_build_id: buildId,
      });

    if (error) throw error;
  }

  // --- Build History Reading ---

  /**
   * Reads all build history logs for the authenticated user.
   */
  async readAllBuilds(): Promise<ProductBuild[]> {
    const { data, error } = await this.store.SupabaseClient()
      .from('product_builds')
      .select('*')
      .eq('user_id', await this.auth.GetAuthenticatedUserId())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Reads all build history logs for a specific product.
   * @param productId The UUID of the product.
   */
  async readBuildsForProduct(productId: string): Promise<ProductBuild[]> {
    const { data, error } = await this.store.SupabaseClient()
      .from('product_builds')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSalesHistory(productId: string): Promise<ProductSalesHistory[]> {
    const { data, error } = await this.store.SupabaseClient()
      .rpc('get_product_sales_history', {
        p_product_id: productId,
      });

    if (error) {
      console.error("Error fetching product sales history:", error);
      throw error;
    }
    return data || [];
  }
}