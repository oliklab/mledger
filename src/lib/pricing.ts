export interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  stripe_price_id: string;
  disabled: boolean;
  free: boolean;
}

class PricingService {
  private static tiers: PricingTier[] = [
    {
      name: 'Free',
      price: 0,
      description: "The perfect starting point for your creative journey. Understand your true costs on your first few products without spending a cent and see if Maker's Ledger is the right fit for you.",
      features: [
        'Track 5 Materials',
        'Record 2 Material Purchase Records',
        'Create 2 Product Recipes and 2 Products',
        'Real-Time COGS Calculation',
        'Free to Signup No Credit Card Required',
      ],
      stripe_price_id: "",
      disabled: true,
      free: true
    }, {
      name: 'Hobbyist',
      price: 4.5, // € per month
      description: 'Perfect for turning your passion into a side-hustle. Get clarity on your costs and price with confidence from your very first sale.',
      features: [
        '30 days Free Trial',
        'Track up to 200 Materials',
        'Create up to 200 Product Recipes',
        'Sales & Profit Tracking (up to 500/mo)',
        'Real-Time COGS Calculation',
        'Reports and Analytics',
        'Low-Stock Alerts',
      ],
      popular: true,
      stripe_price_id: "price_1RpQNGHLA8PM7HIFc9O1ieWd", // Prod Stripe
      disabled: false,
      free: false
    },
    {
      name: 'Crafter - (Upcoming)',
      price: 9.5, // € per month
      description: 'The essential toolkit for growing your business. Automate your workflow and save hours of administrative time every week.',
      features: [
        '30 days Free Trial',
        'Everything in Hobbyist, plus:',
        'Unlimited Materials & Recipes',
        'Unlimited Sales Tracking',
        'Etsy & Shopify Integration',
        'Automated Order Syncing',
      ],
      popular: false,
      stripe_price_id: "",
      disabled: true,
      free: false
    },
  ];

  static getAllTiers(): PricingTier[] {
    return this.tiers;
  }

  static getCommonFeatures(): string[] {
    return [
      'Online Support within 2 business day.',
    ];
  }

  static formatPrice(price: number): string {
    return `$${price}`;
  }

}

export default PricingService;