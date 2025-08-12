"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import PricingService from "@/lib/pricing";
import { PricingTier } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";

export default function PaymentsPage() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const pricingTiers = PricingService.getAllTiers();
  const { toast } = useToast();

  const handleSubscribe = async (tier: PricingTier) => {
    if (tier.disabled || !tier.stripe_price_id) return;
    setLoadingPriceId(tier.stripe_price_id);

    try {
      // 1. Make a POST request to your API route
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: tier.stripe_price_id }),
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // 2. Redirect the user to the Stripe Checkout URL
      if (url) {
        window.location.href = url;
      }

    } catch (err: any) {
      // 3. Handle any errors and show a toast notification
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not redirect to checkout. Please try again.",
      });
      setLoadingPriceId(null);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Choose Your Plan</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Unlock the full potential of your craft business.
          </p>
          <p className="mt-4 text-lg">
            30 day Free trial. Use promo code <strong>PH6OFF</strong> for additional 50% off for 6 months.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {pricingTiers.filter(tier => !tier.free).map(tier => (
            <Card
              key={tier.name}
              className={`flex flex-col h-full transition-all duration-300 ${tier.popular ? 'border-primary shadow-lg' : ''} ${tier.disabled ? 'bg-slate-100 text-muted-foreground' : ''}`}
            >
              <CardHeader className="p-6">
                {tier.popular && (
                  <Badge variant="default" className="w-fit self-start mb-2 bg-primary text-primary-foreground">Most Popular</Badge>
                )}
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="flex items-baseline gap-2 pt-4">
                  <p className="text-4xl font-bold tracking-tight">€{tier.price.toFixed(2)}</p>
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                <CardDescription className="pt-2 min-h-[60px]">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex-grow">
                <ul className="space-y-3">
                  {tier.features.map(feature => (
                    <li key={feature} className="flex items-start">
                      <Check className={`h-5 w-5 mr-3 flex-shrink-0 ${tier.disabled ? 'text-slate-400' : 'text-green-500'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6 bg-slate-50/50 mt-auto">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => handleSubscribe(tier)}
                  disabled={tier.disabled || !!loadingPriceId}
                >
                  {loadingPriceId === tier.stripe_price_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : tier.disabled ? 'Coming Soon' : 'Choose Plan'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}