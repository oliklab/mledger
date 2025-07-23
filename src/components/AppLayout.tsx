"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Key,
  DoorOpen,
  HeartPulse,
  LucideHeartPulse,
  ShoppingBag,
  ShoppingBasket,
  CookingPot,
  StoreIcon,
  ListOrderedIcon,
  LucideBook,
  LucideBugPlay,
  LucideActivity,
  LucideUser,
  LucideListChecks,
} from 'lucide-react';
import { UseUserContext } from "@/lib/context/GlobalContext";
import { NewSPASassClient } from "@/lib/supabase/client";
import md5 from 'md5';
import GravatarCard from '@/components/Gravatar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { user } = UseUserContext();

  const navigation = [
    { name: 'Dashbaord', href: '/app', icon: Home },

    { name: 'Materials', href: '/app/materials', icon: ShoppingBasket },
    { name: 'Purchases', href: '/app/purchases', icon: LucideListChecks },
    { name: 'Recipes', href: '/app/recipes', icon: CookingPot },
    { name: 'Products', href: '/app/inventory', icon: StoreIcon },
    { name: 'Orders', href: '/app/orders', icon: LucideActivity },

    { name: 'Profile', href: '/app/profile', icon: LucideUser },
    { name: 'Support', href: '/app/support', icon: LucideHeartPulse },
    { name: 'Documentation', href: '/docs/documentation', icon: LucideBook },
    { name: 'Lanidng Page', href: '/', icon: DoorOpen },
  ];

  const handleLogout = async () => {
    try {
      const client = await NewSPASassClient();
      await client.Logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  const handleGoToProfile = async () => {
    router.push('/app/profile');
  };

  const getAvatarUrl = (email?: string | null, size: number = 32) => {
    if (!email) {
      return `https://www.gravatar.com/avatar/?s=${size}&d=mp`;
    }
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`;
  };

  const productName = process.env.NEXT_PUBLIC_PRODUCTNAME;
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-gray-100">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out z-30 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        <div className="h-16 flex items-center justify-between px-4 border-b">
          <span className="text-xl font-semibold text-primary-600">{productName}</span>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

      </div>

      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 flex items-center justify-between h-16 bg-white shadow-sm px-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="relative ml-auto">
            <button
              onClick={() => setUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <img
                src={getAvatarUrl(user?.email, 32)}
                alt="User avatar"
                className="w-8 h-8 rounded-full"
              />
              <span>{user?.profile?.first_name || user?.email || 'Loading...'}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border">
                {user ? (
                  <>
                    <GravatarCard
                      email={user.email}
                      fallback={
                        <div className="p-4 flex items-center space-x-3 border-b">
                          <img src={getAvatarUrl(user.email, 64)} alt="User avatar" className="w-12 h-12 rounded-full" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{`${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim() || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      }
                    />
                  </>
                ) : (
                  <div className="p-4 text-sm text-gray-500">Loading user...</div>
                )}
                <div className="py-1">
                  <button
                    onClick={() => { setUserDropdownOpen(false); handleGoToProfile() }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Key className="mr-3 h-4 w-4 text-gray-400" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="mr-3 h-4 w-4 text-red-400" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}