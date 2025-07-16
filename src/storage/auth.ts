import { SaasClient } from "@/lib/supabase/saas";
import { UserProfile, UserProfileStore } from "@/storage/profiles";

export type AuthUser = {
  email: string;
  id: string;
  registered_at: Date;
  profile: UserProfile;
};


export class AuthStore {
  private store: SaasClient;
  private model!: UserProfile;

  constructor(store: SaasClient) {
    this.store = store;
  }

  WithProfile(model: UserProfile) {
    this.model = model;
    return this;
  }

  async GetAuthenticatedUser() {
    // Get user data
    const { data: { user: authUser }, error: authErr } = await this.store.SupabaseClient().auth.getUser();
    if (authErr) throw authErr;

    if (authUser) {
      const profile = await new UserProfileStore(this.store).
        Read(authUser.id);

      return {
        email: authUser.email!,
        id: authUser.id,
        registered_at: new Date(authUser.created_at),
        profile: profile,
      } as AuthUser;
    }
    throw 'error: user profile not found';
  }

  async LoginWithEmail() {
    return this.store.SupabaseClient().auth.signInWithPassword({
      email: this.model.email,
      password: this.model.password
    });
  }

  async SignUpWithDetails() {
    return this.store.SupabaseClient().auth.signUp({
      email: this.model.email,
      password: this.model.password,
      options: {
        emailRedirectTo: process.env.NEXT_APP_BASE_URL + '/app',
        data: {
          first_name: this.model.first_name,
          last_name: this.model.last_name,
          phone_number: this.model.phone_number,
          location: this.model.location,
        }
      }
    });
  }

  async UpdatePassword(password: string) {
    return this.store.SupabaseClient().auth.updateUser({
      password: password
    });
  }

  async ExchangeCodeForSession(code: string) {
    return this.store.SupabaseClient().auth.exchangeCodeForSession(code);
  }

  async ResendVerificationEmail(email: string) {
    return this.store.SupabaseClient().auth.resend({
      email: email,
      type: 'signup'
    })
  }
}

