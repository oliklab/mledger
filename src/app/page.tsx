import React from 'react';
import Link from 'next/link';
import { ArrowRight, Globe, Shield, Users, Key, Database, Clock, AlertTriangle, Boxes, NotebookText, PackageMinus, TrendingUp, ShoppingCart } from 'lucide-react';
import AuthAwareButtons from '@/components/AuthAwareButtons';
import HomePricing from "@/components/HomePricing";

export default function Home() {
  const productName = process.env.NEXT_PUBLIC_PRODUCTNAME;

  const features = [
    {
      icon: Boxes,
      title: 'Smart Material Inventory',
      description: 'Easily log all your raw materials, from yarn skeins to sheets of leather. Buy in bulk (e.g., skeins, meters) and the app tracks inventory in the exact units you craft with (e.g., grams, cm).',
      color: 'text-green-600'
    },
    {
      icon: NotebookText,
      title: 'Automated Product Costing',
      description: 'Instantly know your Cost of Goods Sold (COGS). Define a product\'s "recipe" once, and the app automatically calculates its exact material cost.',
      color: 'text-orange-600'
    },
    {
      icon: PackageMinus,
      title: 'Real-Time Stock Deduction',
      description: 'Maintain perfect inventory accuracy. When you log a finished product, the required materials are instantly deducted from your stock.',
      color: 'text-red-600'
    },
    {
      icon: TrendingUp,
      title: 'Sales & Profit Tracking',
      description: 'Log sales to track revenue, costs, and net profit per order. Instantly identify your most profitable products.',
      color: 'text-teal-600'
    },
    {
      icon: ShoppingCart,
      title: 'Simple Purchase Logging',
      description: 'Keep costs accurate. Quickly log new supply purchases to update stock counts and automatically re-calculate average material costs.',
      color: 'text-purple-600'
    },
    {
      icon: AlertTriangle,
      title: 'Low-Stock Alerts',
      description: 'Avoid production delays. Set minimum inventory levels for key materials and receive alerts before you need to reorder.',
      color: 'text-blue-600'
    }
  ];

  const stats = [
    { label: 'Makers & Businesses Onboarded', value: '100+' },
    { label: 'Product Recipes Created', value: '500+' },
    { label: 'Supporting Countries', value: '5+' },
    { label: 'Finished Goods', value: '$30K' }
  ];

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                {productName}
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <AuthAwareButtons variant="nav" />
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Simple Ledger for Makers
              <span className="block text-4xl md:text-5xl text-primary-600">With Confidence</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              The simple app for makers to track materials, calculate exact product costs, and understand their profit.
            </p>
            <p className="mt-4 text-lg font-semibold text-gray-800">
              Coming soon! Get ready to take control of your craft business.
            </p>
            <div className="mt-10 flex gap-4 justify-center">

              <AuthAwareButtons />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary-600">{stat.value}</div>
                <div className="mt-2 text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Everything You Need</h2>
            <p className="mt-4 text-xl text-gray-600">
              Built with modern technologies for reliability, with simplicity in mind.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <feature.icon className={`h-8 w-8 ${feature.color}`} />
                <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomePricing />

      <section className="py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Turn Your Passion into Profit?
          </h2>
          <p className="mt-4 text-xl text-primary-100">
            Join thousands of Makers to track your craft business with {productName}
          </p>
          <Link
            href="/auth/register"
            className="mt-8 inline-flex items-center px-6 py-3 rounded-lg bg-white text-primary-600 font-medium hover:bg-primary-50 transition-colors"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Product</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="#features" className="text-gray-600 hover:text-gray-900">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Resources</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/docs/documentation" className="text-gray-600 hover:text-gray-900">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="https://github.com/oliklab/makers-ledger/issues" className="text-gray-600 hover:text-gray-900">
                    Report Issues
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/docs/privacy" className="text-gray-600 hover:text-gray-900">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/docs/terms" className="text-gray-600 hover:text-gray-900">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-600">
              © {new Date().getFullYear()} {productName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}