'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, User } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  CreditCard,
  MapPin,
  UserCircle,
  Building,
  Receipt,
  Settings,
  LogOut
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: User['role'][];
}

const navigation: NavItem[] = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'tenant_admin', 'client_admin', 'employee'],
  },
  // Super Admin Routes
  {
    name: 'Plans',
    href: '/dashboard/plans',
    icon: CreditCard,
    roles: ['super_admin'],
  },
  {
    name: 'Companies',
    href: '/dashboard/companies',
    icon: Building,
    roles: ['super_admin'],
  },
  {
    name: 'All Invoices',
    href: '/dashboard/invoices',
    icon: Receipt,
    roles: ['super_admin'],
  },
  // Tenant Admin Routes
  {
    name: 'Clients',
    href: '/dashboard/clients',
    icon: Users,
    roles: ['tenant_admin'],
  },
  {
    name: 'Subscription Plans',
    href: '/dashboard/subscription-plans',
    icon: CreditCard,
    roles: ['tenant_admin'],
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    roles: ['tenant_admin'],
  },
  {
    name: 'Invoices',
    href: '/dashboard/tenant-invoices',
    icon: Receipt,
    roles: ['tenant_admin'],
  },
  // Client Admin Routes
  {
    name: 'Branches',
    href: '/dashboard/branches',
    icon: Building2,
    roles: ['client_admin'],
  },
  {
    name: 'Reports',
    href: '/dashboard/client-reports',
    icon: FileText,
    roles: ['client_admin'],
  },
  // Employee Routes
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: UserCircle,
    roles: ['employee'],
  },
];

export default function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const userNavigation = navigation.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className="flex h-full w-64 flex-col bg-white shadow-sm border-r">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">WorkforceSync</h1>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user.name?.charAt(0) || user.email.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name || user.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {userNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-600'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t">
        <button
          onClick={logout}
          className="group flex w-full items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
          Sign out
        </button>
      </div>
    </div>
  );
} 