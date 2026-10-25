"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  User,
  ShoppingCart,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ordersApi, ApiOrder } from "@/lib/api";

export default function PaymentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPaymentOrder() {
      try {
        setLoading(true);
        setError(null);
        const orderId = parseInt(id.replace(/^PAY-/, ""), 10);
        if (isNaN(orderId)) {
          setError("Invalid payment reference format.");
          return;
        }
        const res = await ordersApi.get(orderId);
        if (res.success && res.data) {
          setOrder(res.data);
        } else {
          setError(res.message || "Payment record not found.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load payment details.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchPaymentOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-[#7699F0]">
        <Loader2 size={36} className="animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">
          Loading payment details from PostgreSQL...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Payment Not Found</h2>
        <p className="text-sm text-gray-500">
          {error || "The payment transaction does not exist or has been removed."}
        </p>
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7699F0] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition"
        >
          <ArrowLeft size={16} /> Back to Payments
        </Link>
      </div>
    );
  }

  const rawStatus = order.payment_status || (order.status === "completed" || order.status === "delivered" ? "Completed" : order.status === "cancelled" ? "Failed" : "Pending");
  const normalizedStatus =
    rawStatus.toLowerCase() === "completed" || rawStatus.toLowerCase() === "paid"
      ? "Completed"
      : rawStatus.toLowerCase() === "cancelled"
      ? "Failed"
      : "Pending";

  const amount = Number(order.total) || 0;
  const fee = amount * 0.01;
  const netAmount = amount - fee;
  const paymentMethod = order.payment_method || "ABA Bank / KHQR";
  const transactionId = `ABA-TXN-${order.id.toString().padStart(8, "0")}`;
  const dateObj = new Date(order.created_at);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : "N/A";
  const formattedTime = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "N/A";

  const getStatusIcon = () => {
    switch (normalizedStatus) {
      case "Completed":
        return <CheckCircle2 className="text-emerald-600" size={24} />;
      case "Pending":
        return <Clock className="text-amber-600" size={24} />;
      case "Failed":
        return <XCircle className="text-red-600" size={24} />;
      default:
        return <Clock className="text-gray-400" size={24} />;
    }
  };

  const getStatusBg = () => {
    switch (normalizedStatus) {
      case "Completed":
        return "bg-emerald-50 border-emerald-100 text-emerald-700";
      case "Pending":
        return "bg-amber-50 border-amber-100 text-amber-700";
      case "Failed":
        return "bg-red-50 border-red-100 text-red-700";
      default:
        return "bg-gray-50 border-gray-100 text-gray-600";
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/payments"
          className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
          <p className="text-sm text-gray-500 mt-0.5">PAY-{order.id}</p>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`rounded-2xl border p-5 flex items-center gap-4 ${getStatusBg()}`}
      >
        {getStatusIcon()}
        <div>
          <p className="font-semibold text-lg">{normalizedStatus}</p>
          <p className="text-sm opacity-80">
            {formattedDate} at {formattedTime}
          </p>
        </div>
      </div>

      {/* Amount Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-sm text-gray-500">Payment Amount</p>
        <p className="text-4xl font-bold text-gray-900 mt-2">
          ${amount.toFixed(2)}
        </p>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div>
            <p className="text-gray-400">Processing Fee (1%)</p>
            <p className="font-medium text-gray-700">
              ${fee.toFixed(2)}
            </p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <p className="text-gray-400">Net Settled</p>
            <p className="font-medium text-emerald-600">
              ${netAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Payment Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[#7699F0]" />
            <h2 className="font-semibold text-gray-900">Payment Info</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span className="font-medium text-gray-900">{paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono text-xs text-gray-700">
                {transactionId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Ref</span>
              <span className="font-medium text-gray-900">PAY-{order.id}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[#7699F0]" />
            <h2 className="font-semibold text-gray-900">Customer</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-900">
                {order.user?.name || `Customer #${order.user_id}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-700">{order.user?.email || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Order Items</span>
              <span className="text-gray-700">{order.items?.length ?? 1} item(s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Order */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-[#7699F0]" />
            <h2 className="font-semibold text-gray-900">Related Order</h2>
          </div>
          <Link
            href={`/admin/orders/${order.id}`}
            className="text-sm font-medium text-[#7699F0] hover:underline"
          >
            View Order #{order.id} →
          </Link>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Order ID:{" "}
          <span className="font-medium text-gray-900">#{order.id}</span>
          {order.shipping_address && (
            <span className="block text-xs text-gray-400 mt-1">
              Ship to: {order.shipping_address}
            </span>
          )}
        </p>
      </div>

      {/* Note */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={18} className="text-[#7699F0]" />
          <h2 className="font-semibold text-gray-900">System Gateway Record</h2>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Order payment processed through automated gateway. Synced with PostgreSQL order record #{order.id}.
        </p>
      </div>
    </div>
  );
}