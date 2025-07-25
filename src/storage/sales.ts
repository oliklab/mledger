import { SaasClient } from "@/lib/supabase/saas";
import { AuthStore } from "@/storage/auth";

// Type Definitions based on the sales_schema.sql
export type Sale = {
  id: string;
  user_id: string;
  customer_details: string | null;
  sale_date: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SaleItem = {
  id: string;
  user_id: string;
  sale_id: string;
  product_id: string | null;
  quantity: number;
  price_per_unit: number;
  cost_per_unit_at_sale: number;
  subtotal: number;
};

export type SaleMetadata = {
  sale: Sale;
  items: SaleItem[];
};

// Type for creating or updating a sale's data
export type SalePayload = {
  saleDetails: Omit<Sale, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'total_amount'>;
  items: Omit<SaleItem, 'id' | 'user_id' | 'sale_id' | 'subtotal'>[];
};

export class SalesStore {
  private store: SaasClient;
  private auth: AuthStore;

  constructor(saas: SaasClient) {
    this.store = saas;
    this.auth = new AuthStore(saas);
  }

  /**
   * Creates a new sale and its line items with a 'Draft' status.
   * This is not a true atomic transaction but includes manual rollback on failure.
   */
  async CreateWithItems(payload: SalePayload): Promise<string> {
    const supabase = this.store.SupabaseClient();
    const userId = await this.auth.GetAuthenticatedUserId();

    // Calculate total amount from line items
    const total_amount = payload.items.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0);

    // 1. Insert the parent 'sales' record
    const { data: newSale, error: saleError } = await supabase
      .from('sales')
      .insert({ ...payload.saleDetails, user_id: userId, total_amount })
      .select('id')
      .single();

    if (saleError) {
      console.error("Error creating parent sale:", saleError);
      throw saleError;
    }

    // 2. Insert the associated 'sale_items'
    const itemsToInsert = payload.items.map(item => ({
      ...item,
      user_id: userId,
      sale_id: newSale.id
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert);

    if (itemsError) {
      // If items fail to insert, roll back the parent sale record for consistency
      console.error("Error inserting sale items. Rolling back parent sale...", itemsError);
      await supabase.from('sales').delete().eq('id', newSale.id);
      throw itemsError;
    }
    return newSale.id;
  }

  /**
   * Fetches all sales and their associated line items for the user efficiently.
   */
  async ReadAllMetadata(): Promise<SaleMetadata[]> {
    const supabase = this.store.SupabaseClient();
    const userId = await this.auth.GetAuthenticatedUserId();

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (salesError) throw salesError;
    if (!sales || sales.length === 0) return [];

    const saleIds = sales.map(s => s.id);
    const { data: allItems, error: itemsError } = await supabase
      .from('sale_items')
      .select('*')
      .in('sale_id', saleIds);

    if (itemsError) throw itemsError;

    const itemsBySaleId = new Map<string, SaleItem[]>();
    allItems?.forEach(item => {
      const existing = itemsBySaleId.get(item.sale_id) || [];
      existing.push(item);
      itemsBySaleId.set(item.sale_id, existing);
    });

    return sales.map(sale => ({
      sale,
      items: itemsBySaleId.get(sale.id) || []
    }));
  }

  /**
   * Fetches a single sale and its associated line items.
   */
  async ReadMetadata(id: string): Promise<SaleMetadata> {
    const supabase = this.store.SupabaseClient();
    const userId = await this.auth.GetAuthenticatedUserId();

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (saleError) throw saleError;

    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', id);

    if (itemsError) throw itemsError;

    return { sale, items: items || [] };
  }

  /**
   * Updates a sale and its line items using a "delete-then-insert" strategy.
   */
  async UpdateWithItems(saleId: string, payload: SalePayload): Promise<string> {
    const supabase = this.store.SupabaseClient();
    const userId = await this.auth.GetAuthenticatedUserId();
    const total_amount = payload.items.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0);

    // 1. Update the parent sale record
    const { error: saleError } = await supabase
      .from('sales')
      .update({ ...payload.saleDetails, total_amount, updated_at: new Date().toISOString() })
      .eq('id', saleId)
      .eq('user_id', userId);

    if (saleError) throw saleError;

    // 2. Delete all existing line items
    await supabase.from('sale_items').delete().eq('sale_id', saleId);

    // 3. Insert the new set of line items
    const itemsToInsert = payload.items.map(item => ({
      ...item,
      user_id: userId,
      sale_id: saleId,
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;

    return saleId;
  }

  /**
   * Finalizes a sale by updating its status to 'Completed' and deducting stock.
   * Calls the `complete_sale_and_update_stock` transactional RPC.
   */
  async CompleteSale(saleId: string) {
    const { error } = await this.store.SupabaseClient().rpc('complete_sale_and_update_stock', { p_sale_id: saleId });
    if (error) throw error;
  }

  /**
   * Reverts a completed sale to a new status and returns stock to inventory.
   * Calls the `revert_completed_sale` transactional RPC.
   */
  async RevertSale(saleId: string, newStatus: 'Draft' | 'Cancelled') {
    const { error } = await this.store.SupabaseClient().rpc('revert_completed_sale', { p_sale_id: saleId, p_new_status: newStatus });
    if (error) throw error;
  }

  /**
   * Deletes a sale record. ON DELETE CASCADE will remove all associated line items.
   */
  async Delete(saleId: string) {
    const { error } = await this.store.SupabaseClient().from('sales').delete().eq('id', saleId);
    if (error) throw error;
  }

  async CreateAndCompleteSale(payload: SalePayload): Promise<string> {
    const { data, error } = await this.store.SupabaseClient().rpc('create_and_complete_sale', {
      p_sale_details: payload.saleDetails,
      p_items: payload.items,
    });

    if (error) {
      console.error("Error calling create_and_complete_sale RPC:", error);
      throw error;
    }

    return data;
  }
}