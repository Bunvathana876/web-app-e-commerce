"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowDownLeft,
  Calendar,
  Hash,
  FileText,
  CreditCard,
  Loader2,
  AlertCircle,
  ShoppingCart,
} from "lucide-react";
import { ordersApi, ApiOrder } from "@/lib/api";

export default function TransactionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactionOrder() {
      try {
        setLoading(true);
        setError(null);
        const orderId = parseInt(id.replace(/^TXN-/, "").replace(/^ORD-/, ""), 10);
        if (isNaN(orderId)) {
          setError("Invalid transaction ID format.");
          return;
        }
        const res = await ordersApi.get(orderId);
        if (res.success && res.data) {
          setOrder(res.data);
        } else {
          setError(res.message || "Transaction record not found.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load transaction details.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchTransactionOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-[#7699F0]">
        <Loader2 size={36} className="animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">
          Loading transaction details from PostgreSQL...
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
        <h2 className="text-xl font-bold text-gray-900">Transaction Not Found</h2>
        <p className="text-sm text-gray-500">
          {error || "The financial transaction does not exist or has been removed."}
        </p>
        <Link
          href="/admin/transactions"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7699F0] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition"
        >
          <ArrowLeft size={16} /> Back to Transactions
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
  const paymentMethod = order.payment_method || "ABA Bank / KHQR";
  const dateObj = new Date(order.created_at);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : "N/A";
  const formattedTime = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "N/A";

  const customerName = order.user?.name || `Customer #${order.user_id}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/transactions"
          className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
          <p className="text-sm text-gray-500 mt-0.5">TXN-{order.id}</p>
        </div>
      </div>

      {/* Amount Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-emerald-50">
          <ArrowDownLeft size={28} className="text-emerald-600" />
        </div>

        <p className="text-sm text-gray-500">Money In (Payment)</p>
        <p className="text-4xl font-bold mt-1 text-emerald-600">
          +${amount.toFixed(2)}
        </p>

        <div className="flex items-center justify-center gap-3 mt-4">
          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            Order Payment
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              normalizedStatus === "Completed"
                ? "bg-emerald-50 text-emerald-700"
                : normalizedStatus === "Failed"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                normalizedStatus === "Completed"
                  ? "bg-emerald-500"
                  : normalizedStatus === "Failed"
                  ? "bg-red-500"
                  : "bg-amber-500"
              }`}
            />
            {normalizedStatus}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Transaction Information</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <FileText size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Description</p>
              <p className="text-sm font-medium text-gray-900">
                Customer payment received from {customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <Hash size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Payment Reference</p>
              <p className="text-sm font-medium text-gray-900 font-mono">
                PAY-{order.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <CreditCard size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Payment Method</p>
              <p className="text-sm font-medium text-gray-900">
                {paymentMethod}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <Calendar size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Timestamp</p>
              <p className="text-sm font-medium text-gray-900">
                {formattedDate} at {formattedTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Links */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="font-semibold text-gray-900 mb-2">Related Records</h2>

        <Link
          href={`/admin/payments/PAY-${order.id}`}
          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition group"
        >
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <CreditCard size={16} className="text-[#7699F0]" />
            Payment Gateway Voucher
          </span>
          <span className="text-sm font-medium text-[#7699F0] group-hover:underline">
            PAY-{order.id} →
          </span>
        </Link>

        <Link
          href={`/admin/orders/${order.id}`}
          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition group"
        >
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <ShoppingCart size={16} className="text-[#7699F0]" />
            Order Details
          </span>
          <span className="text-sm font-medium text-[#7699F0] group-hover:underline">
            #{order.id} →
          </span>
        </Link>
      </div>
    </div>
  );
}