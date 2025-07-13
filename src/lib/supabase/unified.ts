import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types";
import { UserProfile } from "@/models/profiles";

export enum ClientType {
  SERVER = 'server',
  SPA = 'spa'
}

export class SassClient {
  private client: SupabaseClient<Database>;
  private clientType: ClientType;

  constructor(client: SupabaseClient, clientType: ClientType) {
    this.client = client;
    this.clientType = clientType;

  }

  async loginEmail(email: string, password: string) {
    return this.client.auth.signInWithPassword({
      email: email,
      password: password
    });
  }

  async registerEmail(email: string, password: string) {
    return this.client.auth.signUp({
      email: email,
      password: password
    });
  }

  async signUpWithDetails(p: UserProfile) {
    return this.client.auth.signUp({
      email: p.email,
      password: p.password,
      options: {
        data: {
          first_name: p.first_name,
          last_name: p.last_name,
          phone_number: p.phone_number,
          location: p.location,
        }
      }
    });
  }

  async exchangeCodeForSession(code: string) {
    return this.client.auth.exchangeCodeForSession(code);
  }

  async resendVerificationEmail(email: string) {
    return this.client.auth.resend({
      email: email,
      type: 'signup'
    })
  }

  async logout() {
    const { error } = await this.client.auth.signOut({
      scope: 'local'
    });
    if (error) throw error;
    if (this.clientType === ClientType.SPA) {
      window.location.href = '/auth/login';
    }
  }

  async uploadFile(myId: string, filename: string, file: File) {
    filename = filename.replace(/[^0-9a-zA-Z!\-_.*'()]/g, '_');
    filename = myId + "/" + filename
    return this.client.storage.from('files').upload(filename, file);
  }

  async getFiles(myId: string) {
    return this.client.storage.from('files').list(myId)
  }

  async deleteFile(myId: string, filename: string) {
    filename = myId + "/" + filename
    return this.client.storage.from('files').remove([filename])
  }

  async shareFile(myId: string, filename: string, timeInSec: number, forDownload: boolean = false) {
    filename = myId + "/" + filename
    return this.client.storage.from('files').createSignedUrl(filename, timeInSec, {
      download: forDownload
    });

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

  getSupabaseClient() {
    return this.client;
  }
}
