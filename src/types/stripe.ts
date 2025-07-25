export interface Plan {
  name: string;
  price: string;
  priceId: string;
  features: string[];
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  price_id: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface CheckoutSessionRequest {
  priceId: string;
  userId: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
}