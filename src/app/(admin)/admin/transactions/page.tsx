"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Eye,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ArrowDownLeft,
  Loader2,
} from "lucide-react";
import { ordersApi, ApiOrder } from "@/lib/api";

const typeFilters = ["All", "Payment", "Refund"];
const statusFilters = ["All", "Completed", "Pending", "Failed"];

export default function TransactionsPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ordersApi.listAll();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error("Failed to load orders for transactions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const transactions = orders.map((order) => {
    const isPaid = order.payment_status === "paid" || order.status === "delivered" || order.status === "shipped";
    const isFailed = order.status === "cancelled" || order.payment_status === "failed";
    const status = isPaid ? "Completed" : isFailed ? "Failed" : "Pending";
    const amount = Number(order.total ?? 0);
    const dateObj = order.created_at ? new Date(order.created_at) : new Date();

    return {
      id: `TXN-${order.id.toString().padStart(4, "0")}`,
      rawId: order.id,
      type: "Payment",
      description: `Order #${order.id} payment (${order.payment_method || "ABA Bank"})`,
      reference: `ORD-${order.id}`,
      amount: amount,
      direction: "in",
      status: status,
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  });

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.reference.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || t.type === typeFilter;
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const totalIn = transactions
    .filter((t) => t.status === "Completed")
    .reduce((sum, t) => sum + t.amount, 0);

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
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Live financial records from orders in PostgreSQL database
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed Transactions Revenue</p>
              <p className="text-xl font-bold text-emerald-600">
                +${totalIn.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <DollarSign className="text-[#7699F0]" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Recorded Orders</p>
              <p className="text-xl font-bold text-gray-900">
                {transactions.length}
              </p>
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
            placeholder="Search by ID, description, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-400 self-center mr-1">Type:</span>
            {typeFilters.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  typeFilter === type
                    ? "bg-[#7699F0] text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-400 self-center mr-1">Status:</span>
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
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin text-[#7699F0] mb-2" size={32} />
            <p className="text-sm">Loading transactions from database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50/70">
                  <th className="font-medium px-6 py-4">Transaction</th>
                  <th className="font-medium px-6 py-4">Type</th>
                  <th className="font-medium px-6 py-4">Reference</th>
                  <th className="font-medium px-6 py-4">Amount</th>
                  <th className="font-medium px-6 py-4">Status</th>
                  <th className="font-medium px-6 py-4">Date</th>
                  <th className="font-medium px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50">
                          <ArrowDownLeft
                            size={16}
                            className="text-emerald-600"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{txn.id}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">
                            {txn.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 font-mono text-xs">
                        {txn.reference}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-emerald-600">
                        +${txn.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                          txn.status
                        )}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${getStatusDot(
                            txn.status
                          )}`}
                        />
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700">{txn.date}</p>
                      <p className="text-xs text-gray-400">{txn.time}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#7699F0] bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                      >
                        <Eye size={15} />
                        View Order
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
              <ArrowLeftRight className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-600 font-medium">No transactions found</p>
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