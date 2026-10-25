"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Loader2,
} from "lucide-react";
import { statsApi, ordersApi, productsApi, usersApi, DashboardStats, ApiOrder, ApiProduct, ApiUser } from "@/lib/api";

type ReportTab = "sales" | "orders" | "products" | "customers";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [dateRange, setDateRange] = useState("7days");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);

  const loadReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes, usersRes] = await Promise.all([
        statsApi.getOverview(),
        ordersApi.list(),
        productsApi.list(),
        usersApi.list(),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data);
      if (productsRes.success && productsRes.data) setProducts(productsRes.data.items);
      if (usersRes.success && usersRes.data) setUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to load reports data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const tabs = [
    { id: "sales" as ReportTab, label: "Sales & Revenue", icon: DollarSign },
    { id: "orders" as ReportTab, label: "Orders", icon: ShoppingCart },
    { id: "products" as ReportTab, label: "Products Catalog", icon: Package },
    { id: "customers" as ReportTab, label: "Customer Accounts", icon: Users },
  ];

  const totalRevenue = stats?.total_revenue ?? orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  const totalOrders = stats?.total_orders ?? orders.length;
  const totalProducts = stats?.total_products ?? products.length;
  const totalCustomers = stats?.total_users ?? users.length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time business performance derived directly from PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-3">
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
              <option value="year">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards from PostgreSQL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Live Gross Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${totalRevenue.toFixed(2)}
          </p>
          <span className="text-xs text-emerald-600 font-medium">PostgreSQL synced</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total Orders</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#7699F0] flex items-center justify-center">
              <ShoppingCart size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalOrders}</p>
          <span className="text-xs text-blue-600 font-medium">{stats?.pending_orders_count ?? 0} pending fulfillment</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Active Products</span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalProducts}</p>
          <span className="text-xs text-violet-600 font-medium">{stats?.low_stock_count ?? 0} low stock items</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Registered Users</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalCustomers}</p>
          <span className="text-xs text-amber-600 font-medium">Accounts active</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? "bg-[#7699F0] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#7699F0]">
          <Loader2 size={36} className="animate-spin mb-2" />
          <p className="text-sm font-medium text-gray-500">
            Generating live reports from PostgreSQL...
          </p>
        </div>
      ) : activeTab === "orders" || activeTab === "sales" ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Recent Customer Orders ({orders.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 10).map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-[#7699F0]">#{o.id}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-900">{o.user?.name || `Customer #${o.user_id}`}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">${Number(o.total).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#7699F0]">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${o.id}`} className="text-xs font-semibold text-[#7699F0] hover:underline">
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "products" ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Products Inventory Performance ({products.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock Units</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.category?.name || `#${p.category_id}`}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">${Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-700">{p.stock}</td>
                    <td className="px-4 py-3 text-amber-500 font-medium">★ {Number(p.rating || 5).toFixed(1)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/products/${p.id}`} className="text-xs font-semibold text-[#7699F0] hover:underline">
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Customer Base ({users.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Registered On</th>
                  <th className="px-4 py-3 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/customers/${u.id}`} className="text-xs font-semibold text-[#7699F0] hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}