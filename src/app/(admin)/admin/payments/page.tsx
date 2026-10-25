"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Eye,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import { ordersApi, ApiOrder } from "@/lib/api";

const statusFilters = ["All", "Completed", "Pending", "Failed"];

export default function PaymentsPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ordersApi.listAll();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const payments = orders.map((order) => {
    const isPaid = order.payment_status === "paid" || order.status === "delivered" || order.status === "shipped";
    const isFailed = order.status === "cancelled" || order.payment_status === "failed";
    const status = isPaid ? "Completed" : isFailed ? "Failed" : "Pending";
    const amount = Number(order.total ?? 0);
    const dateObj = order.created_at ? new Date(order.created_at) : new Date();

    return {
      id: `PAY-${order.id.toString().padStart(4, "0")}`,
      orderId: `ORD-${order.id}`,
      customer: order.user?.name || `Customer #${order.user_id}`,
      method: order.payment_method || "ABA Bank",
      amount: amount,
      status: status,
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  });

  const filtered = payments.filter((p) => {
    const matchSearch =
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.orderId.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: payments.reduce((sum, p) => sum + (p.status === "Completed" ? p.amount : 0), 0),
    completed: payments.filter((p) => p.status === "Completed").length,
    pending: payments.filter((p) => p.status === "Pending").length,
    failed: payments.filter((p) => p.status === "Failed").length,
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700";
      case "Pending":
        return "bg-amber-50 text-amber-700";
      case "Failed":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500";
      case "Pending":
        return "bg-amber-500";
      case "Failed":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track all payment transactions from PostgreSQL database
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <DollarSign className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Received</p>
              <p className="text-xl font-bold text-gray-900">
                ${stats.total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <CheckCircle2 className="text-[#7699F0]" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
              <XCircle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-xl font-bold text-gray-900">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by payment ID, order ID, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === status
                  ? "bg-[#7699F0] text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin text-[#7699F0] mb-2" size={32} />
            <p className="text-sm">Loading payments from database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50/70">
                  <th className="font-medium px-6 py-4">Payment ID</th>
                  <th className="font-medium px-6 py-4">Order</th>
                  <th className="font-medium px-6 py-4">Customer</th>
                  <th className="font-medium px-6 py-4">Method</th>
                  <th className="font-medium px-6 py-4">Amount</th>
                  <th className="font-medium px-6 py-4">Status</th>
                  <th className="font-medium px-6 py-4">Date</th>
                  <th className="font-medium px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{payment.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders`}
                        className="text-[#7699F0] hover:underline font-medium"
                      >
                        {payment.orderId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{payment.customer}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <CreditCard size={14} className="text-gray-400" />
                        {payment.method}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                          payment.status
                        )}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${getStatusDot(
                            payment.status
                          )}`}
                        />
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700">{payment.date}</p>
                      <p className="text-xs text-gray-400">{payment.time}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders`}
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

        {!loading && filtered.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-600 font-medium">No payments found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try changing your search or filters
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium">1–{filtered.length}</span> of{" "}
              <span className="font-medium">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}