"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { UseUserContext } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const { user } = UseUserContext();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    { name: "Pro Monthly", price: "€15", priceId: "price_YOUR_MONTHLY_API_ID" },
    { name: "Pro Yearly", price: "€150", priceId: "price_YOUR_YEARLY_API_ID" },
  ];

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(priceId);
    try {
      const res = await fetch('/api/create-checkout-session', { // Assumes you proxy this via Next.js API route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.id }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      // Redirect user to Stripe's hosted checkout page
      window.location.href = url;
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-center">Pricing</h1>
      <p className="text-center text-muted-foreground mt-2">Choose the plan that's right for you.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        {plans.map(plan => (
          <Card key={plan.priceId}>
            <CardHeader><CardTitle>{plan.name}</CardTitle><CardDescription>All features included.</CardDescription></CardHeader>
            <CardContent><p className="text-4xl font-bold">{plan.price}</p></CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleSubscribe(plan.priceId)} disabled={!!loading}>
                {loading === plan.priceId ? "Redirecting..." : "Subscribe"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}