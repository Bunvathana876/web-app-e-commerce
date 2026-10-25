"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  RotateCcw,
  User,
  ShoppingCart,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ordersApi, ApiOrder } from "@/lib/api";

export default function RefundDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const orderId = parseInt(id.replace(/^REF-/, ""), 10);

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadRefundOrder = useCallback(async () => {
    if (isNaN(orderId)) {
      setNotification({ type: "error", text: "Invalid refund ID format." });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await ordersApi.get(orderId);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setNotification({
          type: "error",
          text: res.message || "Refund order record not found.",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to load refund details from PostgreSQL.",
      });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadRefundOrder();
  }, [loadRefundOrder]);

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    setNotification(null);
    try {
      const res = await ordersApi.updateStatus(orderId, { status: newStatus });
      if (res.success && res.data) {
        setOrder(res.data);
        setNotification({
          type: "success",
          text: `Refund status updated to "${newStatus}" in PostgreSQL database!`,
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to update refund status in database.",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-[#7699F0]">
        <Loader2 size={36} className="animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">
          Loading refund details from PostgreSQL...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Refund Record Not Found</h2>
        <p className="text-sm text-gray-500">
          The refund record for {id} was not found in PostgreSQL.
        </p>
        <Link
          href="/admin/refunds"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7699F0] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition"
        >
          <ArrowLeft size={16} /> Back to Refunds
        </Link>
      </div>
    );
  }

  const isProcessed = order.status === "cancelled" || order.payment_status === "refunded";
  const statusDisplay = isProcessed ? "Completed" : "Pending";
  const amount = Number(order.total) || 0;
  const dateObj = new Date(order.created_at);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/refunds"
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Refund Details</h1>
            <p className="text-sm text-gray-500 mt-0.5">REF-{order.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isProcessed ? (
            <>
              <button
                onClick={() => handleUpdateStatus("processing")}
                disabled={updating}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Mark Under Review
              </button>
              <button
                onClick={() => handleUpdateStatus("cancelled")}
                disabled={updating}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition"
              >
                {updating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Approve & Refund
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={14} /> Refund Settled in PostgreSQL
            </span>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl text-sm border ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Status Banner */}
      <div
        className={`rounded-2xl border p-5 flex items-center justify-between ${
          statusDisplay === "Completed"
            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
            : "bg-amber-50 border-amber-100 text-amber-800"
        }`}
      >
        <div className="flex items-center gap-3">
          <RotateCcw size={22} />
          <div>
            <p className="font-semibold text-base">Refund {statusDisplay}</p>
            <p className="text-xs opacity-75">
              Order status: {order.status} · Recorded {dateObj.toLocaleDateString()}
            </p>
          </div>
        </div>
        <p className="text-2xl font-bold">-${amount.toFixed(2)}</p>
      </div>

      {/* Order & Customer Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[#7699F0]" />
            <h2 className="font-semibold text-gray-900">Customer</h2>
          </div>
          <div className="text-sm space-y-1">
            <p className="font-medium text-gray-900">
              {order.user?.name || `Customer #${order.user_id}`}
            </p>
            <p className="text-gray-500">{order.user?.email || "No email"}</p>
            <p className="text-gray-500">{order.user?.phone || "No phone"}</p>
          </div>
        </div>

        {/* Order link */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-[#7699F0]" />
              <h2 className="font-semibold text-gray-900">Related Order</h2>
            </div>
            <Link
              href={`/admin/orders/${order.id}`}
              className="text-xs font-semibold text-[#7699F0] hover:underline"
            >
              View Order →
            </Link>
          </div>
          <div className="text-sm space-y-1">
            <p className="font-mono text-gray-900">#{order.id}</p>
            <p className="text-gray-500">Method: {order.payment_method || "ABA Bank"}</p>
            <p className="text-gray-500">
              Delivery: {order.shipping_address || "Standard shipping"}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Order Items</h2>
        <div className="divide-y divide-gray-100">
          {(order.items && order.items.length > 0) ? (
            order.items.map((item, index) => (
              <div key={index} className="flex justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">
                    {item.product_name || `Product #${item.product_id}`}
                  </p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-900">
                  ${(Number(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))
          ) : (
            <div className="py-4 text-sm text-gray-500 text-center">
              Order items recorded under Order #{order.id}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}