import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/storage/types";

export enum ClientType {
  SERVER = 'server',
  SPA = 'spa'
}

export class SaasClient {
  private client: SupabaseClient<Database>;
  private clientType: ClientType;

  constructor(client: SupabaseClient, clientType: ClientType) {
    this.client = client;
    this.clientType = clientType;
  }

  async Logout() {
    return this.client.auth.signOut()
  }

  async getMyTodoList(page: number = 1, pageSize: number = 100, order: string = 'created_at', done: boolean | null = false) {
    let query = this.client.from('todo_list').select('*').range(page * pageSize - pageSize, page * pageSize - 1).order(order)
    if (done !== null) {
      query = query.eq('done', done)
    }
    return query
  }

  async createTask(row: Database["public"]["Tables"]["todo_list"]["Insert"]) {
    return this.client.from('todo_list').insert(row)
  }

  async removeTask(id: string) {
    return this.client.from('todo_list').delete().eq('id', id)
  }

  async updateAsDone(id: string) {
    return this.client.from('todo_list').update({ done: true }).eq('id', id)
  }

  public SupabaseClient() {
    return this.client;
  }
}