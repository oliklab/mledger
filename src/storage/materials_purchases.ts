import { SaasClient } from "@/lib/supabase/saas";

/**
 * Represents a single purchase event for a specific material.
 * This acts as a log entry for inventory and cost history.
 */
export type MaterialPurchase = {
  id: string;
  user_id: string;
  material_id: string;
  purchase_date: string; // SQL DATE is typically a 'YYYY-MM-DD' string
  total_cost: number;
  total_quantity: number;
  avg_cost: number; // This is a generated field in the DB
  supplier_name: string | null; // Can be null
  supplier_contact: string | null; // Can be null
  created_at: string;
  updated_at: string;
};

export class MaterialStore {
  private store: SaasClient;

  constructor(saas: SaasClient) {
    this.store = saas;
  }

  async Read(id: string): Promise<MaterialPurchase> {
    const { data: data, error: err } = await this.store.SupabaseClient()
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (err) throw err;
    return data;
  }
}