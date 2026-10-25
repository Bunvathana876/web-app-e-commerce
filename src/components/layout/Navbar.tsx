"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  Search,
  Menu,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  Package,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notificationsApi, type ApiNotification } from "@/lib/api";

interface NavbarProps {
  onMenuClick?: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
  title?: string;
}

export default function Navbar({
  onMenuClick,
  onToggleCollapse,
  isCollapsed = false,
  title = "Dashboard",
}: NavbarProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<ApiNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleNotificationClick = async (notif: ApiNotification) => {
    setDropdownOpen(false);
    if (!notif.read) {
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await notificationsApi.markAsRead(notif.id);
      } catch {}
    }
    let target = notif.link || "/admin/notifications";
    if (target.startsWith("/orders")) {
      target = `/admin${target}`;
    }
    router.push(target);
  };

  // Fetch unread count & recent notifications
  const loadNotifications = async () => {
    try {
      const countRes = await notificationsApi.getUnreadCount();
      if (countRes.success) {
        setUnreadCount(countRes.unread_count);
      }
      const listRes = await notificationsApi.getAll({ limit: 4 });
      if (listRes.success && listRes.data) {
        setRecentNotifications(listRes.data);
      }
    } catch {
      // Ignore background fetch failure
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "order":
        return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      case "delivery":
        return <Package className="w-4 h-4 text-emerald-600" />;
      case "promo":
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-gray-200">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <h1 className="text-lg font-semibold text-gray-800 hidden sm:block">
          {title}
        </h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center max-w-md w-full mx-4">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7699F0] focus:border-transparent"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications Popover Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
            title="Notifications"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-50 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <Link
                  href="/admin/notifications"
                  onClick={() => setDropdownOpen(false)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  View all <ExternalLink size={12} />
                </Link>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {recentNotifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No recent notifications
                  </div>
                ) : (
                  recentNotifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left p-3.5 hover:bg-gray-100/70 transition-all flex gap-3 cursor-pointer ${
                        !notif.read ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-gray-100 h-fit shrink-0">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <p className={`text-xs truncate ${!notif.read ? "text-gray-900 font-bold" : "text-gray-700 font-medium"}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                <Link
                  href="/admin/notifications"
                  onClick={() => setDropdownOpen(false)}
                  className="block w-full py-2 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  Manage All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100">
          <div className="w-8 h-8 rounded-full bg-[#7699F0] flex items-center justify-center text-white">
            <User size={16} />
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700">
            Admin
          </span>
        </button>
      </div>
    </header>
  );
}
