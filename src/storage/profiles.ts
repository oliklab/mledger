import { SaasClient } from "@/lib/supabase/saas";
import { NewSSRSassClient } from "@/lib/supabase/server";

export type UserProfile = {
  id: string;
  email: string;
  password: string; // Would be private.
  first_name: string;
  last_name: string;
  phone_number: string;
  location: string;

  created_at: string;
  updated_at: string;
};

export class UserProfileStore {
  private model!: UserProfile;
  private store: SaasClient;

  constructor(saas: SaasClient) {
    this.store = saas;
  }

  WithProfile(model: UserProfile) {
    this.model = model;
    return this;
  }

  async Read(id: string) {
    const { data: data, error: err } = await this.store.SupabaseClient()
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (err) throw err;
    return data as UserProfile;
  }

}