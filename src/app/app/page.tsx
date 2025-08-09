"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UseUserContext } from '@/lib/context/GlobalContext';
import Link from 'next/link';

// Supabase and Storage
import { NewSPASassClient } from '@/lib/supabase/client';
import { Material, MaterialStore } from '@/storage/materials';
import { Product, ProductStore, ProductBuild } from '@/storage/products';
import { SaleMetadata, SalesStore, SaleItem } from '@/storage/sales';

// UI Components
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { Skeleton } from '@/components/ui/skeleton';

// Utils and Icons
import { FormatCurrency, IsThisMonth, FormatDate, HasActiveSubscription } from '@/lib/utils';
import {
  Loader2,
  AlertCircle,
  Wallet,
  Plus,
  TrendingUp,
  Package,
  Boxes,
  Hammer,
  ShoppingCart,
  FlaskConical,
  FileText,
  AlertTriangle,
  ArrowRight,
  CalendarDays, // Added
  CreditCard
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { loading, user } = UseUserContext(); // Added user from context

  // State
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [builds, setBuilds] = useState<ProductBuild[]>([]);
  const [sales, setSales] = useState<SaleMetadata[]>([]);

  // Data Fetching
  const loadData = useCallback(async () => {
    try {
      const supabase = await NewSPASassClient();
      const [materialsData, productsData, buildsData, salesData] = await Promise.all([
        new MaterialStore(supabase).ReadAll(),
        new ProductStore(supabase).ReadAll(),
        new ProductStore(supabase).readAllBuilds(),
        new SalesStore(supabase).ReadAllMetadata()
      ]);
      setMaterials(materialsData);
      setProducts(productsData);
      setBuilds(buildsData);
      setSales(salesData);
    } catch (err: any) {
      setError("Failed to load dashboard data: " + err.message);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Analytics Calculations
  const analytics = useMemo(() => {
    const completedSalesThisMonth = sales.filter(s => s.sale.status === 'Completed' && IsThisMonth(s.sale.sale_date));

    const revenueThisMonth = completedSalesThisMonth.reduce((sum, s) => sum + s.sale.total_amount, 0);

    const cogsThisMonth = completedSalesThisMonth.flatMap(s => s.items).reduce((sum, item) => sum + (item.quantity * item.cost_per_unit_at_sale), 0);

    const profitThisMonth = revenueThisMonth - cogsThisMonth;
    const lowStockCount = materials.filter(m => m.current_stock <= m.minimum_threshold).length;
    const openOrdersCount = sales.filter(s => s.sale.status === 'Draft').length;

    return {
      revenueThisMonth: FormatCurrency(revenueThisMonth),
      profitThisMonth: FormatCurrency(profitThisMonth),
      salesThisMonthCount: completedSalesThisMonth.length,
      lowStockCount,
      openOrdersCount
    };
  }, [sales, materials]);

  const lowStockMaterials = useMemo(() => {
    return materials
      .filter(m => m.current_stock <= m.minimum_threshold)
      .slice(0, 5); // Show top 5
  }, [materials]);

  const recentActivity = useMemo(() => {
    const recentSales = sales.slice(0, 5).map(s => ({
      type: 'Sale',
      id: s.sale.id,
      description: s.sale.customer_details || 'Walk-in Sale',
      value: FormatCurrency(s.sale.total_amount),
      date: s.sale.sale_date,
      href: `/app/sales/${s.sale.id}`
    }));

    const productMap = new Map(products.map(p => [p.id, p.name]));
    const recentBuilds = builds.slice(0, 5).map(b => ({
      type: 'Build',
      id: b.id,
      description: `${b.quantity_built}x ${productMap.get(b.product_id) || 'Unknown Product'}`,
      value: `Cost: ${FormatCurrency(b.total_cost_at_build)}`,
      date: b.created_at,
      href: `/app/products/${b.product_id}`
    }));

    return [...recentSales, ...recentBuilds]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [sales, builds, products]);

  const daysSinceRegistration = useMemo(() => {
    if (!user?.registered_at) return 0;
    const today = new Date();
    const registrationDate = new Date(user.registered_at);
    const diffTime = Math.abs(today.getTime() - registrationDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [user]);


  const hasActiveSubscription = useMemo(() => HasActiveSubscription(user?.subscription), [user]);
  if (initialLoading) {
    return <div className="p-8"><Skeleton className="h-screen w-full" /></div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* --- PAGE HEADER --- */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-1 text-base text-gray-600">
          Welcome back! Here's a snapshot of your business activity for {new Date().toLocaleString('en-IE', { month: 'long', year: 'numeric' })}.
        </p>
      </div>

      {/* --- SUBSCRIPTION ALERT --- */}
      {!hasActiveSubscription && (
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertTitle>Please Subscribe</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            You do not have any active Subscription. Upgrade to unlock all features.
            <Button asChild size="sm">
              <Link href="/app/payments">View Plans <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {/* --- ANALYTICS GRID --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <AnalyticsCard title="Revenue (This Month)" value={analytics.revenueThisMonth} icon={TrendingUp} description="Gross revenue from completed sales this month." />
        <AnalyticsCard title="Profit (This Month)" value={analytics.profitThisMonth} icon={Wallet} description="Revenue minus the cost of goods sold (COGS)." />
        <AnalyticsCard title="Sales (This Month)" value={analytics.salesThisMonthCount.toString()} icon={ShoppingCart} description="Number of individual sales completed this month." />
        <AnalyticsCard title="Low Stock Materials" value={analytics.lowStockCount.toString()} icon={AlertTriangle} description="Materials at or below their reorder threshold." />
        <AnalyticsCard title="Open Orders" value={analytics.openOrdersCount.toString()} icon={FileText} description="Sales currently in 'Draft' status." />
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Button variant="outline" className="flex flex-col h-24" asChild><Link href="/app/sales/new"><ShoppingCart className="h-6 w-6 mb-2" />New Sale</Link></Button>
              <Button variant="outline" className="flex flex-col h-24" asChild><Link href="/app/products/new"><Boxes className="h-6 w-6 mb-2" />New Product</Link></Button>
              <Button variant="outline" className="flex flex-col h-24" asChild><Link href="/app/recipes/new"><FlaskConical className="h-6 w-6 mb-2" />New Recipe</Link></Button>
              <Button variant="outline" className="flex flex-col h-24" asChild><Link href="/app/materials"><Package className="h-6 w-6 mb-2" />New Material</Link></Button>
              <Button variant="outline" className="flex flex-col h-24" asChild><Link href="/app/purchases/new"><Hammer className="h-6 w-6 mb-2" />New Purchase</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={`${activity.type}-${activity.id}`} className="flex items-center">
                      <div className="p-2 bg-slate-100 rounded-full mr-4">
                        {activity.type === 'Sale' ? <ShoppingCart className="h-5 w-5 text-slate-500" /> : <Hammer className="h-5 w-5 text-slate-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{FormatDate(activity.date)}</p>
                      </div>
                      <p className={`text-sm font-semibold ${activity.type === 'Sale' ? 'text-green-600' : ''}`}>{activity.value}</p>
                      <Button variant="ghost" size="sm" asChild className="ml-2"><Link href={activity.href}><ArrowRight className="h-4 w-4" /></Link></Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No recent activity to show.</p>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Right Column: User Info & Low Stock */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome, {user?.profile.first_name || 'Maker'}!</CardTitle>
              <CardDescription className="flex items-center gap-2 pt-1">
                <CalendarDays className="h-4 w-4" />
                Member for {daysSinceRegistration} days
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Materials</CardTitle>
              <CardDescription>These items need to be reordered soon.</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockMaterials.length > 0 ? (
                <div className="space-y-3">
                  {lowStockMaterials.map(material => (
                    <Link href={`/app/materials/${material.id}`} key={material.id} className="block p-3 rounded-md hover:bg-slate-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">{material.name}</p>
                          <p className="text-xs text-muted-foreground">Threshold: {material.minimum_threshold} {material.crafting_unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-destructive">{material.current_stock.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">in stock</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No materials are currently low on stock. Great job!</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>User Guide.</CardTitle>
              <CardDescription className="flex items-center gap-2 pt-1">
                <Link href={`/docs/documentation`}>Click here to read the User Guide.</Link>
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}