"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  Eye,
  Database,
  Plus,
  ShoppingBag,
  FolderOpen,
  ArrowRight,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  statsApi,
  productsApi,
  ordersApi,
  DashboardStats,
  ApiProduct,
  ApiOrder,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<ApiProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  // Calendar State
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Dynamic Greeting based on time of day
  const [greeting, setGreeting] = useState<{ text: string; subtext: string; icon: string }>({
    text: "Good day",
    subtext: "Here’s what’s happening in your store today.",
    icon: "✨",
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting({
        text: "Good morning",
        subtext: "Start your day with an overview of your store's live performance.",
        icon: "☀️",
      });
    } else if (hour >= 12 && hour < 17) {
      setGreeting({
        text: "Good afternoon",
        subtext: "Track your real-time store activity and fulfill incoming customer orders.",
        icon: "🌤️",
      });
    } else if (hour >= 17 && hour < 22) {
      setGreeting({
        text: "Good evening",
        subtext: "Review today's total revenue, completed orders, and stock updates.",
        icon: "🌆",
      });
    } else {
      setGreeting({
        text: "Good night",
        subtext: "Store is running smoothly on PostgreSQL 24/7.",
        icon: "🌙",
      });
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, prodRes, ordersRes] = await Promise.all([
        statsApi.getOverview(),
        productsApi.list({ limit: 6, sort: "popular" }),
        ordersApi.listAll(),
      ]);
      setStats(statsRes.data);
      setTopProducts(prodRes.data?.items || []);
      setRecentOrders((ordersRes.data || []).slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calendar Calculations
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: { day: number; isCurrentMonth: boolean; date: Date }[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      days.push({
        day: dayNum,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth - 1, dayNum),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentYear, currentMonth, i),
      });
    }

    // Next month padding to fill complete 5-6 weeks grid (35 or 42 slots)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth + 1, i),
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const prevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const jumpToToday = () => {
    const today = new Date();
    setCalendarDate(today);
    setSelectedDate(today);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "delivered":
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "shipped":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* ========== Dynamic Time-of-Day Greeting Banner ========== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#7699F0] via-blue-600 to-indigo-600 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3 border border-white/20 shadow-sm">
              <span className="text-sm">{greeting.icon}</span>
              <span>PostgreSQL 16 Synced</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight flex items-center gap-2.5">
              <span>{greeting.text}</span>, {user?.name || "Admin"} 👋
            </h1>

            <p className="mt-2 text-blue-100 max-w-xl text-sm leading-relaxed font-normal">
              {greeting.subtext}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 backdrop-blur-sm shadow-sm cursor-pointer"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <Link
              href="/admin/products/create"
              className="px-5 py-2.5 bg-white text-[#7699F0] text-sm font-bold rounded-xl hover:bg-blue-50 transition shadow-md flex items-center gap-1.5"
            >
              <Plus size={16} /> Add Product
            </Link>
          </div>
        </div>

        {/* Ambient background blur elements */}
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* ========== 5-Card Stats Overview Grid ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1.5 tracking-tight">
                ${loading ? "..." : (stats?.total_revenue ?? 0).toFixed(2)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-4 flex items-center gap-1">
            <span>●</span> Live Sales Total
          </p>
        </div>

        {/* Total Orders */}
        <Link
          href="/admin/orders"
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#7699F0]/40 transition-all block group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1.5 tracking-tight group-hover:text-[#7699F0] transition">
                {loading ? "..." : stats?.total_orders ?? 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs">
            <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              {stats?.pending_orders_count ?? 0} pending
            </span>
            <span className="text-gray-400">orders</span>
          </div>
        </Link>

        {/* Products in Catalog */}
        <Link
          href="/admin/products"
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#7699F0]/40 transition-all block group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Products</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1.5 tracking-tight group-hover:text-[#7699F0] transition">
                {loading ? "..." : stats?.total_products ?? 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            {stats?.low_stock_count ?? 0} low stock items
          </p>
        </Link>

        {/* Categories */}
        <Link
          href="/admin/categories"
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#7699F0]/40 transition-all block group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Categories</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1.5 tracking-tight group-hover:text-[#7699F0] transition">
                {loading ? "..." : stats?.total_categories ?? 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#7699F0] flex items-center justify-center">
              <FolderOpen size={20} />
            </div>
          </div>
          <p className="text-xs text-[#7699F0] font-medium mt-4 flex items-center gap-1">
            Manage Categories <ArrowUpRight size={12} />
          </p>
        </Link>

        {/* Users */}
        <Link
          href="/admin/customers"
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#7699F0]/40 transition-all block group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Users</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1.5 tracking-tight group-hover:text-[#7699F0] transition">
                {loading ? "..." : stats?.total_users ?? 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Customers & Admins
          </p>
        </Link>
      </div>

      {/* ========== Main Content Grid ========== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Recent Orders & Products Catalog */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Orders Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">Recent Customer Orders</h2>
                <p className="text-xs text-gray-500 mt-0.5">Live orders submitted via Mobile App or Web</p>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-[#7699F0] hover:text-blue-700 flex items-center gap-1"
              >
                View all orders <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                <div className="w-6 h-6 border-2 border-[#7699F0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading orders...
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs bg-gray-50/70 border-b border-gray-100">
                      <th className="font-medium px-6 py-3">Order ID</th>
                      <th className="font-medium px-6 py-3">Customer</th>
                      <th className="font-medium px-6 py-3">Items</th>
                      <th className="font-medium px-6 py-3">Total</th>
                      <th className="font-medium px-6 py-3">Status</th>
                      <th className="font-medium px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentOrders.map((order) => {
                      const totalNum =
                        typeof order.total === "number"
                          ? order.total
                          : parseFloat(order.total || "0");

                      return (
                        <tr key={order.id} className="hover:bg-gray-50/60 transition">
                          <td className="px-6 py-4">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="font-bold text-[#7699F0] hover:underline"
                            >
                              #ORD-{order.id}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 truncate max-w-36">
                              {order.user?.name || `Customer #${order.user_id}`}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate max-w-36">
                              {order.user?.email || order.shipping_address}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {order.items?.length || 1} item(s)
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            ${totalNum.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize inline-block ${getStatusBadge(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#7699F0] hover:bg-blue-50 transition inline-flex"
                              title="View Order"
                            >
                              <Eye size={16} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag size={24} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No orders placed yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  When orders are placed on mobile or web, they will immediately stream here live.
                </p>
              </div>
            )}
          </div>

          {/* Products in Catalog Preview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">Products Catalog Preview</h2>
                <p className="text-xs text-gray-500 mt-0.5">Live items in PostgreSQL inventory</p>
              </div>
              <Link
                href="/admin/products"
                className="text-xs font-semibold text-[#7699F0] hover:text-blue-700 flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                <div className="w-6 h-6 border-2 border-[#7699F0] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading catalog...
              </div>
            ) : topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs bg-gray-50/70 border-b border-gray-100">
                      <th className="font-medium px-6 py-3">Product</th>
                      <th className="font-medium px-6 py-3">Category</th>
                      <th className="font-medium px-6 py-3">Price</th>
                      <th className="font-medium px-6 py-3">Stock</th>
                      <th className="font-medium px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topProducts.map((p) => {
                      const price = typeof p.price === "number" ? p.price : parseFloat(p.price || "0");
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/60 transition">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
                                {p.image_url ? (
                                  <img
                                    src={p.image_url}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package size={16} className="text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate max-w-44">{p.name}</p>
                                <p className="text-[10px] text-gray-400">ID #{p.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-xs text-gray-600">
                            {p.category?.name || "General"}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-gray-900">
                            ${price.toFixed(2)}
                          </td>
                          <td className="px-6 py-3.5">
                            <span
                              className={`text-xs font-semibold ${
                                p.stock === 0
                                  ? "text-red-600"
                                  : p.stock < 10
                                  ? "text-amber-600"
                                  : "text-gray-700"
                              }`}
                            >
                              {p.stock} units
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="text-xs font-semibold text-[#7699F0] hover:underline"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold text-gray-700">No products in database</p>
                <Link
                  href="/admin/products/create"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#7699F0] px-3.5 py-1.5 rounded-lg"
                >
                  <Plus size={14} /> Create First Product
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Calendar Widget & Hub */}
        <div className="space-y-6">
          {/* ========== Clean Mini Calendar Widget ========== */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#7699F0] flex items-center justify-center">
                  <CalendarIcon size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <p className="text-[11px] text-gray-400">Store Schedule & Events</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={jumpToToday}
                  className="px-2 py-1 text-[11px] font-semibold text-[#7699F0] hover:bg-blue-50 rounded-md transition cursor-pointer"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 text-center">
              {dayNames.map((d) => (
                <span key={d} className="text-[11px] font-bold text-gray-400 py-1">
                  {d}
                </span>
              ))}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((item, idx) => {
                const isSelectedDay = isSelected(item.date);
                const isTodayDay = isToday(item.date);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(item.date)}
                    className={`h-8 w-8 mx-auto rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                      isSelectedDay
                        ? "bg-[#7699F0] text-white shadow-sm shadow-blue-200"
                        : isTodayDay
                        ? "bg-blue-50 text-[#7699F0] font-bold border border-blue-200"
                        : item.isCurrentMonth
                        ? "text-gray-700 hover:bg-gray-50"
                        : "text-gray-300 hover:bg-gray-50/50"
                    }`}
                  >
                    {item.day}
                    {/* Tiny dot on today's date */}
                    {isTodayDay && !isSelectedDay && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#7699F0]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Footer Info */}
            <div className="pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
              <span className="font-medium text-gray-700">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="font-bold text-gray-900 text-sm">Quick Management Hub</h2>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link
                href="/admin/products/create"
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-gray-50/80 hover:bg-blue-50 border border-gray-100 hover:border-[#7699F0]/40 transition text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#7699F0] flex items-center justify-center group-hover:scale-110 transition">
                  <Package size={16} />
                </div>
                <span className="text-xs font-semibold text-gray-700">New Product</span>
              </Link>

              <Link
                href="/admin/categories/create"
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-gray-50/80 hover:bg-violet-50 border border-gray-100 hover:border-violet-200 transition text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center group-hover:scale-110 transition">
                  <FolderOpen size={16} />
                </div>
                <span className="text-xs font-semibold text-gray-700">New Category</span>
              </Link>

              <Link
                href="/admin/orders"
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-gray-50/80 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 transition text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition">
                  <ShoppingCart size={16} />
                </div>
                <span className="text-xs font-semibold text-gray-700">Manage Orders</span>
              </Link>

              <Link
                href="/admin/customers"
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-gray-50/80 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 transition text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
                  <Users size={16} />
                </div>
                <span className="text-xs font-semibold text-gray-700">Customers</span>
              </Link>
            </div>
          </div>

          {/* Database & Infrastructure Live Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
              <Database size={16} className="text-[#7699F0]" />
              <span>PostgreSQL & System Services</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500">Database Engine</span>
                <span className="font-semibold text-emerald-600">PostgreSQL 16 (:5433)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500">Backend API</span>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono font-semibold text-[#7699F0] hover:underline flex items-center gap-1"
                >
                  Swagger Docs ↗
                </a>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500">pgAdmin 4 GUI</span>
                <a
                  href="http://localhost:5050"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#7699F0] hover:underline flex items-center gap-1"
                >
                  :5050 Web GUI ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}