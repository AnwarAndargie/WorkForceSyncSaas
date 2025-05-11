import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: React.ReactNode;
};

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  homeHref?: string;
}

export function Breadcrumb({ items, homeHref = "/" }: BreadcrumbProps) {
  return (
    <nav className="flex items-center text-sm text-gray-500 mb-4">
      <Link href={homeHref} className="flex items-center hover:text-orange-500">
        <Home className="h-4 w-4 mr-1" />
        <span>Home</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-2" />
          {item.href ? (
            <Link href={item.href} className="flex items-center hover:text-orange-500">
              {item.icon && <span className="mr-1">{item.icon}</span>}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className="font-medium text-gray-700 flex items-center">
              {item.icon && <span className="mr-1">{item.icon}</span>}
              <span>{item.label}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
} 