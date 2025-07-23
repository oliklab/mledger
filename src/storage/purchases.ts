import { SaasClient } from "@/lib/supabase/saas";
import { AuthStore } from "@/storage/auth";
import { MaterialPurchase, MaterialPurchaseStore } from "./material_purchases";

export type Purchase = {
  id: string;
  user_id: string;
  name: string;
  // total_cost: number;
  purchase_date: string;
  status: string | null;
  notes: string | null; // Can be null
  created_at: string; // Timestamps are typically represented as ISO strings
  updated_at: string;
};

export type PurchaseMetadata = {
  purchase: Purchase;
  materials: MaterialPurchase[];
  total_cost: number;
  total_items: number;
};

type CreateWithItemsPayload = {
  name: string;
  purchase_date: string;
  status: string;
  notes: string;
  items: {
    material_id: string;
    quantity: number; // This should already be converted to the crafting unit
    cost: number;
    supplier_name?: string;
    supplier_contact?: string;
  }[];
};

export class PurchasesStore {
  private store: SaasClient;
  private auth: AuthStore;


  constructor(saas: SaasClient) {
    this.store = saas;
    this.auth = new AuthStore(saas);
  }

  async Read(id: string): Promise<Purchase> {
    const { data: data, error: err } = await this.store.SupabaseClient()
      .from('purchases')
      .select('*')
      .eq('id', id)
      .eq('user_id', await this.auth.GetAuthenticatedUserId())
      .single();

    if (err) throw err;
    return data;
  }

  async ReadAll(): Promise<Purchase[]> {
    const { data: data, error: err } = await this.store.SupabaseClient()
      .from('purchases')
      .select('*')
      .eq('user_id', await this.auth.GetAuthenticatedUserId())
      .order('updated_at', { ascending: false });

    if (err) throw err;
    return data;
  }

  // In storage/purchases.ts, inside the PurchaseStore class
  async ReadMetadata(purchaseId: string): Promise<PurchaseMetadata> {
    const { data: purchase, error: purchaseError } = await this.store.SupabaseClient()
      .from('purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (purchaseError) throw purchaseError;

    const { data: materials, error: materialsError } = await this.store.SupabaseClient()
      .from('material_purchases')
      .select('*')
      .eq('purchase_id', purchaseId);
    if (materialsError) throw materialsError;

    const total_cost = materials.reduce((sum, item) => sum + (item.total_cost || 0), 0);

    return {
      purchase: purchase,
      materials: materials,
      total_cost: total_cost,
      total_items: materials.length,
    };
  }

  async ReadAllWithMetadata(): Promise<PurchaseMetadata[]> {
    const { data, error } = await this.store.SupabaseClient()
      .from('purchases')
      .select('*, material_purchases(*)') // The join magic happens here!
      .eq('user_id', await this.auth.GetAuthenticatedUserId())
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error("Error fetching purchases with materials:", error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // 2. Transform the result into the PurchaseMetadata structure
    // The data from Supabase has the purchase fields and a `material_purchases` array at the same level.
    // We need to reshape it to match `PurchaseMetadata`.
    const purchaseMetadata: PurchaseMetadata[] = data.map(p => {
      // Separate the nested materials from the main purchase data
      const { material_purchases, ...purchaseData } = p;

      // Ensure the nested data is treated as the correct type
      const materials: MaterialPurchase[] = material_purchases as MaterialPurchase[];
      const total_cost = materials.reduce((sum, item) => sum + (item.total_cost || 0), 0);

      return {
        purchase: purchaseData as Purchase,
        materials: materials,
        total_cost: total_cost,
        total_items: materials.length,
      };
    });

    return purchaseMetadata;
  }

  async Create(model: Purchase) {
    const { data: data, error: err } = await this.store.SupabaseClient()
      .from('purchases')
      .insert(model);

    if (err) throw err;
    return data;
  }

  async CreateWithItems(payload: CreateWithItemsPayload): Promise<string> {
    const { data, error } = await this.store.SupabaseClient().rpc('create_purchase_order_with_items', {
      p_name: payload.name,
      p_purchase_date: payload.purchase_date,
      p_status: payload.status,
      p_notes: payload.notes,
      p_items: payload.items, // Pass the JavaScript array directly
    });

    if (error) {
      // Log the detailed error for debugging
      console.error("Error calling create_purchase_order_with_items RPC:", error);
      throw error;
    }

    return data;
  }

  async Update(model: Purchase) {
    const { data: data, error: err } = await this.store.SupabaseClient()
      .from('purchases')
      .update({
        name: model.name,
        purchase_date: model.purchase_date,
        // total_cost: model.total_cost,
        notes: model.notes,
        updated_at: new Date().toISOString(),
        status: model.status,
      })
      .eq('id', model.id)
      .eq('user_id', await this.auth.GetAuthenticatedUserId());

    if (err) throw err;
    return data;
  }

  async UpdateWithItems(payload: {
    purchaseId: string;
    name: string;
    purchase_date: string;
    status: string;
    notes: string;
    items: any[];
  }) {
    const { error } = await this.store.SupabaseClient().rpc('update_purchase_order_with_items', {
      p_purchase_id: payload.purchaseId,
      p_name: payload.name,
      p_purchase_date: payload.purchase_date,
      p_status: payload.status,
      p_notes: payload.notes,
      p_new_items: payload.items,
    });

    if (error) throw error;
  }


  async Delete(id: string) {
    const records = await new MaterialPurchaseStore(this.store).ReadAllForPurchase(id);
    for (const record of records) {
      await new MaterialPurchaseStore(this.store).Delete(record.id);
    }
    const { data: data, error: err } = await this.store.SupabaseClient()
      .from('purchases')
      .delete()
      .eq('id', id);

    if (err) throw err;
  }
}