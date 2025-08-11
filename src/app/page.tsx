import React from 'react';
import Link from 'next/link';
import { ArrowRight, Globe, Shield, Users, Key, Database, Clock, AlertTriangle, Boxes, NotebookText, PackageMinus, TrendingUp, ShoppingCart, Hammer, CheckCircle, LucideMail } from 'lucide-react';
import AuthAwareButtons from '@/components/AuthAwareButtons';
import HomePricing from "@/components/HomePricing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calculator } from 'lucide-react';

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
            {/* Container is now always a flex container */}
            <div className="flex items-center gap-4 md:gap-8">
              {/* These links are hidden on mobile, but appear on medium screens and up */}
              <Link href="#features" className="hidden md:inline-block text-gray-600 hover:text-gray-900">
                Features
              </Link>
              <Link href="#pricing" className="hidden md:inline-block text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="https://discord.gg/BpvYhcb3jd" target="_blank" className="hidden md:inline-block text-gray-600 hover:text-gray-900">
                Discord
              </Link>
              {/* This button component is now visible on all screen sizes */}
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
        <div className="absolute inset-0 bg-white/85 backdrop-blur-sm"></div>

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
            <a
              href="https://www.producthunt.com/products/maker-s-ledger?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-maker&#0045;s&#0045;ledger"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" className="mr-2 text-orange-500">
                {/* Product Hunt Cat SVG */}
                <path d="M10 0C4.477 0 0 4.477 0 10c0 5.523 4.477 10 10 10s10-4.477 10-10C20 4.477 15.523 0 10 0zM8 15V5l6 5-6 5z" fill="currentColor" />
              </svg>
              Follow on Product Hunt
            </a>
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

      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">

            {/* Question 1 */}
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg text-left font-medium">Who is Maker's Ledger for?</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-gray-700">
                Maker's Ledger is designed specifically for hobbyists, side-hustlers, and early-stage handmade business owners. If you sell on Etsy, at craft fairs, or through social media and are currently using a messy spreadsheet (or nothing at all!) to track your costs, this tool is built for you. We focus on clarity and simplicity, not complex accounting jargon.
              </AccordionContent>
            </AccordionItem>

            {/* Question 2 */}
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg text-left font-medium">Is this a full accounting app?</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-gray-700">
                No, and that's our strength. Maker's Ledger is intentionally focused on **inventory and material cost tracking (COGS)**, the two areas where general accounting software fails for makers. We are not a replacement for QuickBooks or Xero, but a specialized tool designed to solve the unique challenges of a handmade business before you need a full accounting suite.
              </AccordionContent>
            </AccordionItem>

            {/* Question 3 */}
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg text-left font-medium">Can I track my labor or overhead costs?</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-gray-700">
                Currently, our focus is on perfecting the most difficult part of craft business finance: calculating your precise **material costs**. We believe getting this number right is the foundation for confident pricing. While direct labor and overhead tracking isn't available in the current version, many users handle overheads by adding them as a monthly "material" purchase to factor them into their overall costs.
              </AccordionContent>
            </AccordionItem>

            {/* Question 4 */}
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg text-left font-medium">Does this track inventory for my Etsy or Shopify shop?</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-gray-700">
                Yes! Our Upcoming "Crafter" plan will integrate directly with Etsy and Shopify to automatically sync your orders. This means when you make a sale on Etsy, the finished product is automatically deducted from your Maker's Ledger inventory, giving you a real-time view of your stock levels without any manual entry.
              </AccordionContent>
            </AccordionItem>

            {/* Question 5 */}
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg text-left font-medium">Is there a free trial?</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-gray-700">
                Yes, all new users receive a **30-day free trial** with full access to all features of the "Crafter" plan. No credit card is required to start your trial. We want you to be completely sure that Maker's Ledger is the right fit for your business before you subscribe.
              </AccordionContent>
            </AccordionItem>

            {/* Question 6 */}
            <AccordionItem value="item-6">
              <AccordionTrigger className="text-lg text-left font-medium">Is my data secure?</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-gray-700">
                Absolutely. Your data security is our top priority. We use industry-standard encryption for all data in transit and at rest. As an Irish company, we are fully compliant with GDPR regulations, ensuring your information is handled with the highest level of privacy and care.
              </AccordionContent>
            </AccordionItem>

            {/* Question 7 */}
            <AccordionItem value="item-7">
              <AccordionTrigger className="text-lg text-left font-medium">How is this different from a spreadsheet?</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-gray-700">
                While spreadsheets are free, they are time-consuming and prone to costly errors. Maker's Ledger automates all the complex calculations. When you log a new material purchase, it automatically calculates a new weighted average cost. When you log a production run, it automatically deducts all the correct raw materials. It saves you hours of manual data entry and prevents mistakes that could be costing you money.
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </section>

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

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              From Spreadsheet Chaos to Crafting Clarity
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              An inventory and cost-tracking tool that finally speaks your language.
            </p>
          </div>

          {/* Stylish 3-Column Layout */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10">

            {/* Column 1: Focus on COGS */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary-100">
                  <Calculator className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Master Your True Costs</h3>
                <p className="mt-2 text-gray-700">
                  Our recipe-based system automatically calculates your <strong>Cost of Goods Sold (COGS)</strong> for every item. Know your exact material costs and stop guessing at your prices.
                </p>
              </div>
            </div>

            {/* Column 2: Focus on Inventory Management */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary-100">
                  <Boxes className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Effortless Inventory Tracking</h3>
                <p className="mt-2 text-gray-700">
                  Perfect for <strong>Etsy inventory management</strong>, our app tracks raw materials and finished goods in real-time. Log a production run, and we deduct the components automatically.
                </p>
              </div>
            </div>

            {/* Column 3: Focus on Competitive Advantage */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary-100">
                  <CheckCircle className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">The Simple Alternative</h3>
                <p className="mt-2 text-gray-700">
                  Tired of complex, expensive tools? Maker's Ledger is the simple <strong>Craftybase alternative</strong> designed for makers, not accountants. Get the features you actually need, without the bloat.
                </p>
              </div>
            </div>

          </div>
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
                  <Link href="https://github.com/oliklab/makers-ledger/issues" target="_blank" className="text-gray-600 hover:text-gray-900">
                    Report Issues
                  </Link>
                </li>
                <li>
                  <Link href="https://discord.gg/BpvYhcb3jd" target="_blank" className="text-gray-600 hover:text-gray-900">
                    Discord
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