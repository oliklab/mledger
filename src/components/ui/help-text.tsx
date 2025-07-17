"use client";

import React from 'react';
import { HelpCircle } from 'lucide-react';

// Define the component's props with TypeScript for type safety
type HelpTextProps = {
  children: React.ReactNode;
  icon?: React.ElementType; // The icon is an optional React component
  variant?: 'default' | 'warning' | 'success'; // The variant can only be one of these strings
};

export default function HelpText({
  children,
  icon: Icon = HelpCircle, // Set HelpCircle as the default icon
  variant = 'default',     // Set 'default' as the default variant
}: HelpTextProps) {

  // The variants object defines the styles for each type of message
  const variants = {
    default: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${variants[variant]} transition-all duration-200`}>
      <div className="text-sm leading-relaxed font-medium">{children}</div>
    </div>
  );
}

export { HelpText }