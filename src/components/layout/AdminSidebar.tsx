"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ScanLine,
  ShoppingCart,
  Package,
  FolderOpen,
  Store,
  Users,
  Star,
  Boxes,
  Truck,
  CreditCard,
  ArrowLeftRight,
  RotateCcw,
  FileText,
  BarChart3,
  Bell,
  UserCog,
  Shield,
  Settings,
} from "lucide-react";
import Sidebar, { SidebarGroup } from "./Sidebar";
import { statsApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

interface AdminSidebarProps {
  isCollapsed?: boolean;
}

export default function AdminSidebar({ isCollapsed = false }: AdminSidebarProps) {
  const [orderCount, setOrderCount] = useState<number | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    let isMounted = true;
    const fetchLiveStats = async () => {
      try {
        const res = await statsApi.getOverview();
        if (isMounted && res?.data) {
          const count = res.data.total_orders;
          setOrderCount(count > 0 ? count : undefined);
        }
      } catch (err) {
        console.error("Failed to load sidebar stats:", err);
      }
    };

    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isSeller = currentUser?.role === "seller";

  // Seller Navigation (Focused Retail & Sales View)
  const sellerGroups: SidebarGroup[] = [
    {
      label: "Retail & Sales",
      items: [
        {
          title: "Dashboard",
          href: "/admin/dashboard",
          icon: <LayoutDashboard size={18} />,
        },
        {
          title: "Point of Sale (POS)",
          href: "/admin/pos",
          icon: <ScanLine size={18} />,
        },
        {
          title: "Orders",
          href: "/admin/orders",
          icon: <ShoppingCart size={18} />,
          badge: orderCount,
        },
        {
          title: "Products",
          href: "/admin/products",
          icon: <Package size={18} />,
        },
        {
          title: "Categories",
          href: "/admin/categories",
          icon: <FolderOpen size={18} />,
        },
      ],
    },
    {
      label: "Stock",
      items: [
        {
          title: "Inventory",
          href: "/admin/inventory",
          icon: <Boxes size={18} />,
        },
      ],
    },
    {
      label: "Reports & Account",
      items: [
        {
          title: "Reports",
          href: "/admin/reports",
          icon: <FileText size={18} />,
        },
        {
          title: "Analytics",
          href: "/admin/analytics",
          icon: <BarChart3 size={18} />,
        },
        {
          title: "Notifications",
          href: "/admin/notifications",
          icon: <Bell size={18} />,
        },
        {
          title: "Profile",
          href: "/admin/profile",
          icon: <UserCog size={18} />,
        },
      ],
    },
  ];

  // Full Admin Navigation
  const adminGroups: SidebarGroup[] = [
    {
      label: "Main",
      items: [
        {
          title: "Dashboard",
          href: "/admin/dashboard",
          icon: <LayoutDashboard size={18} />,
        },
        {
          title: "Point of Sale (POS)",
          href: "/admin/pos",
          icon: <ScanLine size={18} />,
        },
        {
          title: "Orders",
          href: "/admin/orders",
          icon: <ShoppingCart size={18} />,
          badge: orderCount,
        },
        {
          title: "Products",
          href: "/admin/products",
          icon: <Package size={18} />,
        },
        {
          title: "Categories",
          href: "/admin/categories",
          icon: <FolderOpen size={18} />,
        },
      ],
    },
    {
      label: "Customers",
      items: [
        {
          title: "Customers",
          href: "/admin/customers",
          icon: <Users size={18} />,
        },
        {
          title: "Reviews",
          href: "/admin/reviews",
          icon: <Star size={18} />,
        },
      ],
    },
    {
      label: "Inventory",
      items: [
        {
          title: "Inventory",
          href: "/admin/inventory",
          icon: <Boxes size={18} />,
        },
        {
          title: "Suppliers",
          href: "/admin/suppliers",
          icon: <Truck size={18} />,
        },
      ],
    },
    {
      label: "Finance",
      items: [
        {
          title: "Payments",
          href: "/admin/payments",
          icon: <CreditCard size={18} />,
        },
        {
          title: "Transactions",
          href: "/admin/transactions",
          icon: <ArrowLeftRight size={18} />,
        },
        {
          title: "Refunds",
          href: "/admin/refunds",
          icon: <RotateCcw size={18} />,
        },
      ],
    },
    {
      label: "Analytics",
      items: [
        {
          title: "Reports",
          href: "/admin/reports",
          icon: <FileText size={18} />,
        },
        {
          title: "Analytics",
          href: "/admin/analytics",
          icon: <BarChart3 size={18} />,
        },
      ],
    },
    {
      label: "System",
      items: [
        {
          title: "Notifications",
          href: "/admin/notifications",
          icon: <Bell size={18} />,
        },
        {
          title: "Admin Users",
          href: "/admin/employees",
          icon: <UserCog size={18} />,
        },
        {
          title: "Roles & Permissions",
          href: "/admin/roles",
          icon: <Shield size={18} />,
        },
        {
          title: "Settings",
          href: "/admin/settings",
          icon: <Settings size={18} />,
        },
      ],
    },
  ];

  return (
    <Sidebar
      groups={isSeller ? sellerGroups : adminGroups}
      title={isSeller ? "Seller Portal" : "Admin Portal"}
      isCollapsed={isCollapsed}
      userName={currentUser?.name || (isSeller ? "Seller" : "Admin")}
      userRole={isSeller ? "Seller" : "Admin"}
    />
  );
}