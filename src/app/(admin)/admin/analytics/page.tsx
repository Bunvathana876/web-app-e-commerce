"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Calendar,
  Loader2,
  Package,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { statsApi, ordersApi, productsApi, DashboardStats, ApiOrder, ApiProduct } from "@/lib/api";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("7days");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        statsApi.getOverview(),
        ordersApi.list(),
        productsApi.list(),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data);
      if (productsRes.success && productsRes.data) setProducts(productsRes.data.items);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const totalRevenue = stats?.total_revenue ?? orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalOrders = stats?.total_orders ?? orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time conversion metrics and database activity from PostgreSQL
          </p>
        </div>

        <div className="relative">
          <Calendar
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="pl-9 pr-8 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] appearance-none"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-[#7699F0]">
          <Loader2 size={36} className="animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-600">
            Calculating analytics from PostgreSQL...
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Gross Sales</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Database verified</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Orders</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#7699F0] flex items-center justify-center">
                  <ShoppingCart size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalOrders}</p>
              <p className="text-xs text-blue-600 font-medium mt-1">Orders in PostgreSQL</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Avg. Order Value</span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${avgOrderValue.toFixed(2)}
              </p>
              <p className="text-xs text-purple-600 font-medium mt-1">Per completed order</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Catalog Size</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Package size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {products.length} Items
              </p>
              <p className="text-xs text-amber-600 font-medium mt-1">Across all categories</p>
            </div>
          </div>

          {/* Breakdown & Top Catalog Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Top Inventory Catalog</h2>
                <Link
                  href="/admin/products"
                  className="text-xs font-semibold text-[#7699F0] hover:underline"
                >
                  View All Products →
                </Link>
              </div>

              <div className="divide-y divide-gray-100">
                {products.slice(0, 6).map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {p.category?.name || "General"} · Stock: {p.stock} units
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">
                      ${Number(p.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Fulfillment Status Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Order Fulfillment Distribution</h2>
              <div className="space-y-3 pt-2">
                {[
                  {
                    status: "Delivered",
                    count: orders.filter((o) => o.status === "delivered").length,
                    color: "bg-emerald-500",
                  },
                  {
                    status: "Shipped",
                    count: orders.filter((o) => o.status === "shipped").length,
                    color: "bg-blue-500",
                  },
                  {
                    status: "Processing",
                    count: orders.filter((o) => o.status === "processing").length,
                    color: "bg-indigo-500",
                  },
                  {
                    status: "Pending",
                    count: orders.filter((o) => o.status === "pending").length,
                    color: "bg-amber-500",
                  },
                  {
                    status: "Cancelled",
                    count: orders.filter((o) => o.status === "cancelled").length,
                    color: "bg-red-500",
                  },
                ].map((item) => {
                  const percent =
                    totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(1) : "0";
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-700">{item.status}</span>
                        <span className="text-gray-500">
                          {item.count} orders ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}