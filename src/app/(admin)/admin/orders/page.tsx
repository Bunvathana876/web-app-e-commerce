"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  ShoppingBag,
  RefreshCw,
  Clock,
  CheckCircle2,
  Trash2,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { ordersApi, ApiOrder } from "@/lib/api";

const statusFilters = ["All", "pending", "processing", "shipped", "delivered", "cancelled"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersApi.listAll();
      setOrders(res.data || []);
    } catch (err: any) {
      console.error("Failed to fetch orders:", err);
      showToast(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await ordersApi.updateStatus(orderId, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      showToast(`Order #ORD-${orderId} status updated to ${newStatus}`);
    } catch (err: any) {
      showToast(err.message || "Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteModalId) return;
    try {
      await ordersApi.delete(deleteModalId);
      setOrders((prev) => prev.filter((o) => o.id !== deleteModalId));
      showToast(`Order #ORD-${deleteModalId} removed from database`);
      setDeleteModalId(null);
    } catch (err: any) {
      showToast(err.message || "Failed to delete order");
    }
  };

  const filtered = orders.filter((order) => {
    const idStr = `#ORD-${order.id}`;
    const custName = order.user?.name || "";
    const custEmail = order.user?.email || "";
    const matchSearch =
      idStr.toLowerCase().includes(search.toLowerCase()) ||
      custName.toLowerCase().includes(search.toLowerCase()) ||
      custEmail.toLowerCase().includes(search.toLowerCase()) ||
      order.shipping_address?.toLowerCase().includes(search.toLowerCase()) ||
      order.payment_method?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "All" ||
      order.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  // Calculate metrics
  const totalRevenue = orders.reduce((acc, curr) => {
    if (curr.status !== "cancelled") {
      const val = typeof curr.total === "number" ? curr.total : parseFloat(curr.total || "0");
      return acc + (isNaN(val) ? 0 : val);
    }
    return acc;
  }, 0);

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

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
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time orders synced directly from PostgreSQL
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition self-start sm:self-auto flex items-center gap-2 text-sm font-medium shadow-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-[#7699F0]" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#7699F0] flex items-center justify-center">
            <ShoppingBag size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Pending Orders</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Delivered</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{deliveredCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <DollarSign size={20} />
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
            placeholder="Search by Order ID (#ORD-1), customer name, email, or address..."
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
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all capitalize ${
                statusFilter === status
                  ? "bg-[#7699F0] text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent"
              }`}
            >
              {status}
              {status !== "All" && (
                <span className="ml-1.5 opacity-80">
                  ({orders.filter((o) => o.status.toLowerCase() === status.toLowerCase()).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-[#7699F0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading orders from PostgreSQL...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50/70 border-b border-gray-100">
                  <th className="font-medium px-6 py-4">Order ID</th>
                  <th className="font-medium px-6 py-4">Customer</th>
                  <th className="font-medium px-6 py-4">Items / Products</th>
                  <th className="font-medium px-6 py-4">Total</th>
                  <th className="font-medium px-6 py-4">Payment</th>
                  <th className="font-medium px-6 py-4">Status</th>
                  <th className="font-medium px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => {
                  const totalNum =
                    typeof order.total === "number"
                      ? order.total
                      : parseFloat(order.total || "0");
                  const dateStr = order.created_at
                    ? new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recent";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-bold text-[#7699F0] hover:underline flex items-center gap-1.5"
                        >
                          #ORD-{order.id}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 uppercase flex-shrink-0">
                            {order.user?.name ? order.user.name.charAt(0) : `U`}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {order.user?.name || `Customer #${order.user_id}`}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {order.user?.email || order.shipping_address}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="font-semibold text-gray-800">
                          {order.items?.length || 1} item{order.items && order.items.length > 1 ? "s" : ""}
                        </span>
                        {order.items && order.items.length > 0 && (
                          <p className="text-xs text-gray-400 truncate max-w-44 mt-0.5">
                            {order.items.map((it) => `${it.quantity}x ${it.product_name}`).join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">${totalNum.toFixed(2)}</p>
                        {order.coupon_code && (
                          <span className="inline-block text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                            🏷️ {order.coupon_code}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-gray-700 block">
                          {order.payment_method}
                        </span>
                        <span
                          className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded capitalize mt-0.5 ${
                            order.payment_status === "paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : order.payment_status === "failed"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none capitalize transition cursor-pointer ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-2 rounded-lg text-gray-400 hover:text-[#7699F0] hover:bg-blue-50 transition"
                            title="View Order Details"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => setDeleteModalId(order.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Order"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-800 font-semibold">No orders found</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== "All"
                ? "Try adjusting your search criteria or status filter."
                : "When customers check out on mobile or web, orders will automatically sync here live."}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">Delete Order #{deleteModalId}?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete this order from the database? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition text-sm shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}