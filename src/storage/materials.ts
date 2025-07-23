import { SaasClient } from "@/lib/supabase/saas";
import { AuthStore } from "@/storage/auth";

/**
 * Represents a raw material in the user's inventory.
 * This defines the material itself, not a specific purchase.
 */
export type Material = {
  id: string;
  user_id: string;
  name: string;
  purchase_unit: string;
  crafting_unit: string;
  conversion_factor: number;
  total_cost: number;
  total_quantity: number;
  avg_cost: number; // This is a generated field in the DB
  unit_price: number;
  current_stock: number;
  minimum_threshold: number;
  notes: string | null; // Can be null
  created_at: string; // Timestamps are typically represented as ISO strings
  updated_at: string;
  sku: string,
  initial_cost: number,
  initial_quantity: number,
  status: string,
  category: string,
  inventoryable: boolean,
};

export class MaterialStore {
  private store: SaasClient;
  private auth: AuthStore;


  constructor(saas: SaasClient) {
    this.store = saas;
    this.auth = new AuthStore(saas);
  }

  async Read(id: string): Promise<Material> {
    const { data: data, error: err } = await this.store.SupabaseClient()
      .from('materials')
      .select('*')
      .eq('id', id)
      .eq('user_id', await this.auth.GetAuthenticatedUserId())
      .single();

    if (err) throw err;
    return data;
  }

  async ReadAll(): Promise<Material[]> {
    const { data: data, error: err } = await this.store.SupabaseClient()
      .from('materials')
      .select('*')
      .eq('user_id', await this.auth.GetAuthenticatedUserId())
      .order('updated_at', { ascending: false });

    if (err) throw err;
    return data;
  }

  async Create(model: Material) {
    if (model.minimum_threshold < 0) {
      model.minimum_threshold = 0;
    }
    const { data: data, error: err } = await this.store.SupabaseClient()
      .from('materials')
      .insert(model);

    if (err) throw err;
    return data;
  }

  async Update(model: Material) {
    const { data: data, error: err } = await this.store.SupabaseClient()
      .from('materials')
      .update({
        name: model.name,
        purchase_unit: model.purchase_unit,
        crafting_unit: model.crafting_unit,
        conversion_factor: model.conversion_factor,
        total_cost: model.total_cost,
        total_quantity: model.total_quantity,
        unit_price: model.unit_price,
        current_stock: model.current_stock,
        minimum_threshold: model.minimum_threshold,
        notes: model.notes,
        updated_at: new Date().toISOString(),
        sku: model.sku,
        initial_cost: model.initial_cost,
        initial_quantity: model.initial_quantity,
        status: model.status,
        category: model.category,
        inventoryable: model.inventoryable,
      })
      .eq('id', model.id)
      .eq('user_id', await this.auth.GetAuthenticatedUserId());

    if (err) throw err;
    return data;
  }

  async Delete(model: Material) {
    const { data: data, error: err } = await this.store.SupabaseClient()
      .from('materials')
      .delete()
      .eq('id', model.id);

    if (err) throw err;
  }
}