"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  RotateCcw,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { ordersApi, ApiOrder } from "@/lib/api";

const statusFilters = ["All", "Pending", "Completed", "Failed"];

export default function RefundsPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchRefundOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersApi.list();
      if (res.success && res.data) {
        // Filter orders that have refund/cancelled indicators or all orders for comprehensive review
        const refundLike = res.data.filter(
          (o) =>
            o.status === "cancelled" ||
            o.payment_status === "refunded" ||
            o.payment_status === "failed"
        );
        // If there are specific cancelled orders, show them, otherwise show list of orders with refund capability
        setOrders(refundLike.length > 0 ? refundLike : res.data);
      }
    } catch (err) {
      console.error("Failed to load refunds:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefundOrders();
  }, [fetchRefundOrders]);

  const refunds = orders.map((order) => {
    const isCompleted = order.payment_status === "refunded" || order.status === "cancelled";
    const status = isCompleted ? "Completed" : "Pending";
    const amount = Number(order.total) || 0;
    const dateObj = new Date(order.created_at);

    return {
      id: `REF-${order.id}`,
      orderId: `ORD-${order.id}`,
      rawOrderId: order.id,
      customer: order.user?.name || `Customer #${order.user_id}`,
      amount: amount,
      reason: order.status === "cancelled" ? "Order Cancelled by Customer" : "Return / Refund Request",
      status: status,
      method: order.payment_method || "ABA Bank / KHQR",
      date: !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString() : "N/A",
      time: !isNaN(dateObj.getTime())
        ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "N/A",
    };
  });

  const filtered = refunds.filter((r) => {
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.orderId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRefunded = refunds
    .filter((r) => r.status === "Completed")
    .reduce((sum, r) => sum + r.amount, 0);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700";
      case "Pending":
        return "bg-amber-50 text-amber-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Refunds & Returns</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor refund requests and cancelled orders from PostgreSQL
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
              <RotateCcw className="text-violet-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Settled Refunds</p>
              <p className="text-xl font-bold text-gray-900">
                ${totalRefunded.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-xl font-bold text-gray-900">
                {refunds.filter((r) => r.status === "Pending").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Processed</p>
              <p className="text-xl font-bold text-gray-900">
                {refunds.filter((r) => r.status === "Completed").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by refund ID, order ID, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-500 mr-2">Status:</span>
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === s
                  ? "bg-[#7699F0] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#7699F0]">
            <Loader2 size={32} className="animate-spin mb-2" />
            <p className="text-sm font-medium text-gray-500">
              Loading refunds from PostgreSQL...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <RotateCcw size={36} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No refund records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Refund ID</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">
                      {r.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-[#7699F0]">
                      <Link href={`/admin/orders/${r.rawOrderId}`} className="hover:underline">
                        {r.orderId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{r.customer}</td>
                    <td className="px-6 py-4 font-semibold text-red-600">
                      -${r.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{r.reason}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{r.date}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/refunds/${r.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#7699F0] bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                      >
                        <Eye size={15} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}