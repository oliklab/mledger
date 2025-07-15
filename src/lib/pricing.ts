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
    price: 3,
    description: 'For those just getting started and selling occasionally.',
    features: [
      'Track up to 100 Materials',
      'Create up to 200 Product Recipes',
      'Log up to 1K Sales/Month',
      'Automatic Product Costing',
      'Low-Stock Alerts',
    ],
    popular: false,
  },
  {
    name: 'Crafter',
    price: 7,
    description: 'For those just getting started and selling occasionally.',
    features: [
      'Unlimited Materials',
      'Unlimited Product Recipes',
      'Unlimited Sales/Month',
      'Automated Sell record from Etsy and Shopify',
      'Low-Stock Alerts',
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