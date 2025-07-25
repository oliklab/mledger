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
    price: 4.5, // € per month
    description: 'Perfect for turning your passion into a side-hustle. Get clarity on your costs and price with confidence from your very first sale.',
    features: [
      'Track up to 200 Materials',
      'Create up to 200 Product Recipes',
      'Sales & Profit Tracking (up to 200/mo)',
      'Real-Time COGS Calculation',
      'Reports and Analytics',
      'Low-Stock Alerts',
    ],
    popular: true,
  },
  {
    name: 'Crafter - (Currently Unavailable)',
    price: 9.5, // € per month
    description: 'The essential toolkit for growing your business. Automate your workflow and save hours of administrative time every week.',
    features: [
      'Everything in Hobbyist, plus:',
      'Unlimited Materials & Recipes',
      'Unlimited Sales Tracking',
      'Etsy & Shopify Integration',
      'Automated Order Syncing',
    ],
    popular: false,
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