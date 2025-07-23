export interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

class PricingService {
  private static tiers: PricingTier[] = [{
    name: 'Hobbyist',
    price: 5, // € per month
    description: 'Perfect for turning your passion into a side-hustle. Get clarity on your costs and price with confidence from your very first sale.',
    features: [
      'Track up to 100 Materials',
      'Create up to 100 Product Recipes',
      'Sales & Profit Tracking (up to 200/mo)',
      'Real-Time COGS Calculation',
      'Low-Stock Alerts',
    ],
    popular: false,
  },
  {
    name: 'Crafter',
    price: 9, // € per month
    description: 'The essential toolkit for growing your business. Automate your workflow and save hours of administrative time every week.',
    features: [
      'Everything in Hobbyist, plus:',
      'Unlimited Materials & Recipes',
      'Unlimited Sales Tracking',
      'Etsy & Shopify Integration',
      'Automated Order Syncing',
    ],
    popular: true,
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