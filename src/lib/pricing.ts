export interface PricingTier {
    name: string;
    price: number;
    description: string;
    features: string[];
    popular?: boolean;
}

class PricingService {
    private static tiers: PricingTier[] = [];

    static initialize() {
        const names = process.env.NEXT_PUBLIC_TIERS_NAMES?.split(',') || [];
        const prices = process.env.NEXT_PUBLIC_TIERS_PRICES?.split(',').map(Number) || [];
        const descriptions = process.env.NEXT_PUBLIC_TIERS_DESCRIPTIONS?.split(',') || [];
        const features = process.env.NEXT_PUBLIC_TIERS_FEATURES?.split(',').map(f => f.split('|')) || [];
        const popularTier = process.env.NEXT_PUBLIC_POPULAR_TIER;

        this.tiers = names.map((name, index) => ({
            name,
            price: prices[index],
            description: descriptions[index],
            features: features[index] || [],
            popular: name === popularTier
        }));
    }

    static getAllTiers(): PricingTier[] {
        if (this.tiers.length === 0) {
            this.initialize();
        }
        return this.tiers;
    }

    static getCommonFeatures(): string[] {
        return process.env.NEXT_PUBLIC_COMMON_FEATURES?.split(',') || [];
    }

    static formatPrice(price: number): string {
        return `$${price}`;
    }

}

export default PricingService;