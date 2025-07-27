import { SaasClient } from "@/lib/supabase/saas";
import { UserProfile, UserProfileStore } from "@/storage/profiles";

export type AuthUser = {
  email: string;
  id: string;
  registered_at: Date;
  profile: UserProfile;
  subscription?: Subscription;
};

export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  price_id: string;
  current_period_end: Date;
  created_at: Date;
  updated_at: Date;
}

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

      const { data: data, error: err } = await this.store.SupabaseClient().from('subscriptions')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      return {
        email: authUser.email!,
        id: authUser.id,
        registered_at: new Date(authUser.created_at),
        profile: profile,
        subscription: data as Subscription,
      } as AuthUser;
    }
    throw 'error: user profile not found';
  }

  async GetAuthenticatedUserId(): Promise<string> {
    // Get user data
    const { data: { user: authUser }, error: authErr } = await this.store.SupabaseClient().auth.getUser();

    // Handle both network errors and the case where no user is found
    if (authErr || !authUser) {
      throw new Error("Authentication error: No user is currently signed in.");
    }

    // If we reach this point, we know authUser is not null, so we can safely return the ID.
    return authUser.id;
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

