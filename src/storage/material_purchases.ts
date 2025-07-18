import { SaasClient } from "@/lib/supabase/saas";
import { AuthStore } from "@/storage/auth";

export type MaterialPurchase = {
  id: string;
  user_id: string;
  material_id: string;
  purchase_date: string;
  total_cost: number;
  total_quantity: number;
  avg_cost: number;
  supplier_name: string | null;
  supplier_contact: string | null;
  created_at: string;
  updated_at: string;
};

// Use Partial for payloads as not all fields are required for every operation
type MaterialPurchasePayload = Partial<MaterialPurchase>;


export class MaterialPurchaseStore {
  private store: SaasClient;
  private auth: AuthStore;

  constructor(saas: SaasClient) {
    this.store = saas;
    this.auth = new AuthStore(saas);
  }

  /**
   * Creates a new material purchase and atomically updates the material's stock via RPC.
   */
  async Create(model: MaterialPurchasePayload): Promise<string> {
    const { data, error } = await this.store.SupabaseClient().rpc('manage_material_purchase', {
      p_material_id: model.material_id,
      p_operation_type: 'CREATE',
      p_purchase_id: null,
      p_purchase_date: model.purchase_date,
      p_total_cost: model.total_cost,
      p_total_quantity: model.total_quantity,
      p_supplier_name: model.supplier_name,
      p_supplier_contact: model.supplier_contact,
    });
    if (error) console.error(error)
    else console.log(data)

    if (error) throw error;
    return data;
  }

  /**
   * Updates a material purchase and atomically recalculates the material's stock via RPC.
   */
  async Update(model: MaterialPurchasePayload): Promise<string> {
    const { data, error } = await this.store.SupabaseClient().rpc('manage_material_purchase', {
      p_operation_type: 'UPDATE',
      p_purchase_id: model.id,
      p_material_id: null,
      p_purchase_date: model.purchase_date,
      p_total_cost: model.total_cost,
      p_total_quantity: model.total_quantity,
      p_supplier_name: model.supplier_name,
      p_supplier_contact: model.supplier_contact,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Deletes a material purchase and atomically reverts the material's stock via RPC.
   */
  async Delete(id: string): Promise<string> {
    const { data, error } = await this.store.SupabaseClient().rpc('manage_material_purchase', {
      p_operation_type: 'DELETE',
      p_purchase_id: id,
      p_material_id: null,
      p_purchase_date: null,
      p_total_cost: null,
      p_total_quantity: null,
      p_supplier_name: null,
      p_supplier_contact: null,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Reads all purchase records for a specific material.
   */
  async ReadAllForMaterial(materialId: string): Promise<MaterialPurchase[]> {
    const { data, error } = await this.store.SupabaseClient()
      .from('material_purchases')
      .select('*')
      .eq('material_id', materialId)
      .eq('user_id', await this.auth.GetAuthenticatedUserId())
      .order('purchase_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  async ReadAllForUserId(): Promise<MaterialPurchase[]> {
    const { data, error } = await this.store.SupabaseClient()
      .from('material_purchases')
      .select('*')
      .eq('user_id', await this.auth.GetAuthenticatedUserId())
      .order('purchase_date', { ascending: false });

    if (error) throw error;
    return data;
  }
}