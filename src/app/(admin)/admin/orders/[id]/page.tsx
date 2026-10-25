"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Printer,
  Trash2,
  AlertCircle,
  Tag,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { ordersApi, ApiOrder } from "@/lib/api";

const STEPS = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;
  const orderId = Number(rawId);

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadOrder = useCallback(async () => {
    if (isNaN(orderId)) {
      setError("Invalid Order ID format");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await ordersApi.get(orderId);
      setOrder(res.data);
    } catch (err: any) {
      console.error("Failed to fetch order:", err);
      setError(err.message || "Order not found in database");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleUpdateStatus = async (
    newStatus?: string,
    newPaymentStatus?: string
  ) => {
    if (!order) return;
    setUpdating(true);
    try {
      const payload: { status?: string; payment_status?: string } = {};
      if (newStatus) payload.status = newStatus;
      if (newPaymentStatus) payload.payment_status = newPaymentStatus;

      const res = await ordersApi.updateStatus(order.id, payload);
      setOrder(res.data);
      showToast("Order status updated successfully in PostgreSQL");
    } catch (err: any) {
      showToast(err.message || "Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    try {
      await ordersApi.delete(order.id);
      router.push("/admin/orders");
    } catch (err: any) {
      showToast(err.message || "Failed to delete order");
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-3 border-[#7699F0] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Fetching order #{rawId} details from database...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
        <p className="text-sm text-gray-500">{error || "Could not retrieve the requested order."}</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7699F0] text-white font-medium hover:bg-[#6085e6] transition text-sm shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Orders List
        </Link>
      </div>
    );
  }

  const currentStatus = (order.status || "pending").toLowerCase();
  const isCancelled = currentStatus === "cancelled";

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "processing":
        return 1;
      case "shipped":
        return 2;
      case "delivered":
      case "completed":
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIndex = getStepIndex(currentStatus);

  const subtotalNum =
    typeof order.subtotal === "number"
      ? order.subtotal
      : parseFloat(order.subtotal || "0");
  const discountNum =
    typeof order.discount_amount === "number"
      ? order.discount_amount
      : parseFloat(order.discount_amount || "0");
  const shippingNum =
    typeof order.shipping_fee === "number"
      ? order.shipping_fee
      : parseFloat(order.shipping_fee || "0");
  const totalNum =
    typeof order.total === "number"
      ? order.total
      : parseFloat(order.total || "0");

  const createdDateFormatted = order.created_at
    ? new Date(order.created_at).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Order #ORD-{order.id}
              </h1>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  isCancelled
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : currentStatus === "delivered"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : currentStatus === "shipped"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : currentStatus === "processing"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              Placed on {createdDateFormatted}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition shadow-sm flex items-center gap-2 text-sm font-medium"
            title="Print Invoice"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={loadOrder}
            disabled={updating}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition shadow-sm flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw size={16} className={updating ? "animate-spin text-[#7699F0]" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition shadow-sm flex items-center gap-2 text-sm font-medium"
            title="Delete Order"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Interactive Status & Live Management Banner */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="font-bold text-gray-900 text-base">Fulfillment & Status</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Change the order progress or payment confirmation in real-time
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600">Order:</span>
              <select
                value={order.status}
                disabled={updating}
                onChange={(e) => handleUpdateStatus(e.target.value, undefined)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7699F0] capitalize cursor-pointer transition"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600">Payment:</span>
              <select
                value={order.payment_status}
                disabled={updating}
                onChange={(e) => handleUpdateStatus(undefined, e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7699F0] capitalize cursor-pointer transition"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stepper or Cancelled Warning */}
        {isCancelled ? (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3">
            <XCircle size={24} className="text-rose-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-rose-800">Order is Cancelled</p>
              <p className="text-xs text-rose-600 mt-0.5">
                This order was marked as cancelled. You can change its status anytime above to reactivate fulfillment.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative pt-2 pb-4">
            {/* Background line */}
            <div className="absolute top-7 left-8 right-8 h-1 bg-gray-100 -z-0" />
            <div
              className="absolute top-7 left-8 h-1 bg-[#7699F0] transition-all duration-500 -z-0"
              style={{
                width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
              }}
            />

            <div className="grid grid-cols-4 relative z-10">
              {STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const IconComponent = step.icon;

                return (
                  <div
                    key={step.key}
                    onClick={() => handleUpdateStatus(step.key, undefined)}
                    className="flex flex-col items-center text-center cursor-pointer group"
                    title={`Click to mark as ${step.label}`}
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                        isPassed
                          ? "bg-[#7699F0] text-white shadow-md shadow-blue-200 scale-105"
                          : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                      }`}
                    >
                      <IconComponent size={20} />
                    </div>
                    <p
                      className={`text-xs mt-2 font-bold transition ${
                        isPassed ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    <span className="text-[10px] text-gray-400">
                      {isCurrent ? "Active Step" : isPassed ? "Completed" : "Upcoming"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Items Snapshot */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Ordered Items</h2>
              <span className="text-xs font-semibold text-gray-500">
                {order.items?.length || 0} product(s)
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => {
                  const priceNum =
                    typeof item.price === "number"
                      ? item.price
                      : parseFloat(item.price || "0");
                  const subtotalNum =
                    typeof item.subtotal === "number"
                      ? item.subtotal
                      : parseFloat(item.subtotal || "0");

                  return (
                    <div key={item.id} className="flex items-center gap-4 p-5 hover:bg-gray-50/50 transition">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 border border-gray-200">
                        <Package size={22} className="text-[#7699F0]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Unit Price: ${priceNum.toFixed(2)} &bull; Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${subtotalNum.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No item snapshots stored for this order.
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="px-6 py-4 bg-gray-50/60 border-t border-gray-100 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">${subtotalNum.toFixed(2)}</span>
              </div>

              {discountNum > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Tag size={14} /> Coupon Discount
                    {order.coupon_code && ` (${order.coupon_code})`}
                  </span>
                  <span className="font-semibold">-${discountNum.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping Fee</span>
                <span className="font-medium text-gray-900">
                  {shippingNum === 0 ? (
                    <span className="text-emerald-600 font-semibold">Free</span>
                  ) : (
                    `$${shippingNum.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-200 text-gray-900">
                <span>Total Amount</span>
                <span className="text-lg text-[#7699F0]">${totalNum.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Customer, Shipping, Payment */}
        <div className="space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-gray-900 font-bold border-b border-gray-100 pb-3">
              <User size={18} className="text-[#7699F0]" />
              <span>Customer</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#7699F0] font-bold text-sm flex items-center justify-center flex-shrink-0 uppercase">
                {order.user?.name ? order.user.name.charAt(0) : "U"}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">
                  {order.user?.name || `Customer #${order.user_id}`}
                </p>
                <p className="text-xs text-gray-400">User ID: #{order.user_id}</p>
              </div>
            </div>

            <div className="pt-2 text-xs space-y-1.5 text-gray-600">
              <p className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="font-medium text-gray-800 truncate max-w-44">
                  {order.user?.email || "Not specified"}
                </span>
              </p>
              {order.user?.phone && (
                <p className="flex justify-between">
                  <span className="text-gray-400">Phone:</span>
                  <span className="font-medium text-gray-800">{order.user.phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-gray-900 font-bold border-b border-gray-100 pb-3">
              <MapPin size={18} className="text-[#7699F0]" />
              <span>Shipping Address</span>
            </div>
            <div className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100 leading-relaxed">
              {order.shipping_address || "No shipping address provided."}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-gray-900 font-bold border-b border-gray-100 pb-3">
              <CreditCard size={18} className="text-[#7699F0]" />
              <span>Payment Details</span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Method:</span>
                <span className="font-semibold text-gray-800">{order.payment_method}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status:</span>
                <span
                  className={`px-2 py-0.5 rounded font-semibold capitalize ${
                    order.payment_status === "paid"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : order.payment_status === "failed"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {order.payment_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Security:</span>
                <span className="text-gray-600 flex items-center gap-1 font-medium">
                  <ShieldCheck size={14} className="text-emerald-500" /> Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">Delete Order #ORD-{order.id}?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete this order from PostgreSQL? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition text-sm shadow-sm"
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}