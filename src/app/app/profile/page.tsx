"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UseUserContext } from '@/lib/context/GlobalContext';
import { NewSPASassClient } from '@/lib/supabase/client';
import { Key, User, CheckCircle, CreditCard, ExternalLink, Loader2, ArrowRight } from 'lucide-react';
import { MFASetup } from '@/components/MFASetup';
import GravatarCard from '@/components/Gravatar';
import { AuthStore } from '@/storage/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import PricingService from "@/lib/pricing";
import { useToast } from '@/hooks/use-toast';

// NOTE: This PricingService would typically be in its own file and imported.
// It's included here to provide context for displaying the plan name.
export interface PricingTier {
  name: string;
  price: number;
  stripe_price_id: string;
}

export default function UserSettingsPage() {
  const { user } = UseUserContext();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isManagingBilling, setIsManagingBilling] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const supabase = await NewSPASassClient();
      const auth = new AuthStore(supabase);
      const { error } = await auth.UpdatePassword(newPassword);
      if (error) throw error;
      setSuccess('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsManagingBilling(true);
    try {
      const response = await fetch('/api/payments/portal', {
        method: 'POST',
      });

      console.log(response);

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }
      if (url) {
        window.open(url, '_blank');
      }

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not open billing management. Please try again.",
      });
    } finally {
      // The user stays on the page, so always reset the loading state
      setIsManagingBilling(false);
    }
  };

  const currentPlan = user?.subscription?.price_id
    ? PricingService.getAllTiers().find(p => p.stripe_price_id === user.subscription?.price_id)
    : null;

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          View your profile information and Manage your account settings.
        </p>
      </div>

      {error && (<Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>)}
      {success && (<Alert><CheckCircle className="h-4 w-4" /><AlertDescription>{success}</AlertDescription></Alert>)}

      <div className="grid gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />User Details</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4 md:col-span-2">
                <div><label className="text-sm font-medium text-gray-500">Name</label><p className="mt-1 text-sm">{user?.profile.first_name} {user?.profile.last_name}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Email</label><p className="mt-1 text-sm">{user?.email}</p></div>
              </div>
              <GravatarCard email={user?.email} fallback={<></>} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Subscription & Billing</CardTitle>
              <CardDescription>Manage your current plan and payment details.</CardDescription>
            </CardHeader>
            <CardContent>
              {currentPlan && user?.subscription ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{currentPlan.name} Plan</p>
                      <p className="text-sm text-muted-foreground capitalize">Status: {user.subscription.status.toUpperCase()}</p>
                    </div>
                    <p className="font-bold text-lg">${currentPlan.price.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  </div>
                  {user.subscription.current_period_end && (
                    <p className="text-sm text-muted-foreground">
                      Your plan renews on {new Date(user.subscription.current_period_end).toLocaleDateString('en-IE')}.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">You are not currently subscribed to any plan.</p>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              {currentPlan ? (
                <Button onClick={handleManageBilling} disabled={isManagingBilling}>
                  {isManagingBilling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Manage Billing <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/app/payments">View Plans <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input type="password" id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <Button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <MFASetup onStatusChange={() => { setSuccess('Two-factor authentication settings updated successfully'); }} />
        </div>
      </div>
    </div>
  );
}