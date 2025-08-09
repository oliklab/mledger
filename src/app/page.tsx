import React from 'react';
import Link from 'next/link';
import { ArrowRight, Globe, Shield, Users, Key, Database, Clock, AlertTriangle, Boxes, NotebookText, PackageMinus, TrendingUp, ShoppingCart, Hammer, CheckCircle, LucideMail } from 'lucide-react';
import AuthAwareButtons from '@/components/AuthAwareButtons';
import HomePricing from "@/components/HomePricing";

export default function Home() {
  const productName = process.env.NEXT_PUBLIC_PRODUCTNAME || 'Makers Ledger';

  const features = [
    {
      icon: Boxes,
      title: 'Smart Material Inventory',
      description: 'Easily log all your raw materials, from yarn skeins to sheets of leather.',
      color: 'text-green-600'
    },
    {
      icon: ShoppingCart,
      title: 'Log Your Supplies',
      description: 'Quickly record every material purchase, from bulk textiles to tiny beads. Track costs, suppliers, and quantities in one organized place.',
      color: 'text-purple-600'
    },
    {
      icon: Boxes,
      title: 'From Bulk to Batch',
      description: 'Buy in kilograms, use in grams. Our smart inventory automatically converts units, so your stock levels are always accurate for crafting.',
      color: 'text-green-600'
    },
    {
      icon: NotebookText,
      title: 'Your Creative Cookbook',
      description: "Define a 'recipe' for each product you make. List the exact materials and quantities, and we'll calculate the true cost of goods sold (COGS) in real-time.",
      color: 'text-orange-600'
    },
    {
      icon: Hammer,
      title: 'Track Your Production',
      description: 'Log a new manufacturing run with one click. We automatically add the finished goods to your product inventory and deduct the right materials from your supply stock.',
      color: 'text-blue-600'
    },
    {
      icon: TrendingUp,
      title: 'Understand Your Profit',
      description: 'Record each sale and instantly see the breakdown: revenue, material costs, and most importantly, your net profit per order.',
      color: 'text-teal-600'
    },
    {
      icon: AlertTriangle,
      title: 'Never Run Out',
      description: 'Set low-stock alerts on critical materials. Get notified before you run out, ensuring your production never has to stop.',
      color: 'text-red-600'
    },
    {
      icon: NotebookText,
      title: 'Automated Product Costing',
      description: 'Instantly know your Cost of Goods Sold (COGS). Define a product\'s "recipe" once.',
      color: 'text-orange-600'
    },
    {
      icon: PackageMinus,
      title: 'Real-Time Stock Deduction',
      description: 'Maintain perfect inventory accuracy. When you log a finished product, the required materials are instantly deducted from your stock.',
      color: 'text-red-600'
    },
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

      <section
        className="relative pt-32 pb-24 text-center overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url('/landing-hero.png')` }}
      >
        {/* Semi-transparent overlay for text readability */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

        {/* Content container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
            The Business Side of Making,
            <span className="block text-primary-600">Simplified.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Maker's Ledger is the all-in-one inventory and bookkeeping software designed to bring clarity to your craft business. Stop guessing at your costs and start pricing with confidence.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <AuthAwareButtons />
            <a href="https://www.producthunt.com/products/maker-s-ledger?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-maker&#0045;s&#0045;ledger" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1003422&theme=neutral&t=1754749861548" alt="Maker&#0039;s&#0032;Ledger - The&#0032;Business&#0032;Side&#0032;of&#0032;Making&#0044;&#0032;Simplified&#0046; | Product Hunt" width="250" height="54" /></a>
          </div>
          <p className="mt-4 text-sm font-semibold text-gray-500">
            30-Day Free Trial &nbsp;•&nbsp; Cancel Anytime &nbsp;•&nbsp; From $4.5 Per Month.
          </p>

          <div className="mt-20 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 text-left">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Master Your Inventory</h3>
                <p className="mt-1 text-gray-600">Effortlessly track every component, from raw materials to finished goods. Get a real-time view of what you have on hand so you can plan production without surprises.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Know Your True Costs</h3>
                <p className="mt-1 text-gray-600">Instantly see your Cost of Goods Sold (COGS) for every product. Monitor all your expenses to understand your exact profit margins and make smarter pricing decisions.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Never Run Out of Stock</h3>
                <p className="mt-1 text-gray-600">Avoid costly delays and lost sales. Set low-stock alerts on your critical supplies so you know exactly when it's time to reorder.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Grow with Confidence</h3>
                <p className="mt-1 text-gray-600">With a clear view of your production costs and profitability, you can scale your business, manage your finances, and turn your passion into a thriving venture.</p>
              </div>
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
            Get Started Now with 30 Day Free Trial
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
                <li>
                  <Link href="mailto:support@makersledger.com" className="text-gray-600 hover:text-gray-900">
                    Contact Us
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
              © {new Date().getFullYear()} Olik Software Lab. All rights reserved.
            </p>
            <p className="text-center text-gray-600">
              ✉ Send your feedback to <a href="mailto:support@makersledger.com">support@makersledger.com</a>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}