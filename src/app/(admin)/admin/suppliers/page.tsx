"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Eye,
  Truck,
  Mail,
  Phone,
  Package,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { sellersApi, ApiSeller } from "@/lib/api";

const statusFilters = ["All", "Active", "Inactive"];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<ApiSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sellersApi.list();
      if (res.success && res.data) {
        setSuppliers(res.data);
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to load suppliers from database.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to remove supplier #${id}?`)) return;
    setDeletingId(id);
    try {
      const res = await sellersApi.delete(id);
      if (res.success) {
        setSuppliers((prev) => prev.filter((s) => s.id !== id));
        setNotification({
          type: "success",
          text: `Supplier #${id} removed successfully from PostgreSQL database.`,
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to remove supplier.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = suppliers.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.owner_name && s.owner_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()));
    const matchStatus =
      statusFilter === "All" ||
      s.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers & Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your merchant supply network stored in PostgreSQL
          </p>
        </div>
        <Link
          href="/admin/suppliers/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7699F0] text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={18} />
          Add Supplier
        </Link>
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

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by company name, contact person or email..."
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
              Loading suppliers from PostgreSQL...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Truck size={36} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No suppliers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Contact Person</th>
                  <th className="px-6 py-4">Products</th>
                  <th className="px-6 py-4">Address / Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#7699F0] flex items-center justify-center font-bold text-sm">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">ID: #{s.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{s.owner_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail size={12} className="text-gray-400" />
                          {s.email}
                        </span>
                        {s.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} className="text-gray-400" />
                            {s.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#7699F0]">
                        <Package size={13} />
                        {s.products_count} items
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {s.address || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          s.status.toLowerCase() === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.status.toLowerCase() === "active"
                              ? "bg-emerald-500"
                              : "bg-gray-400"
                          }`}
                        />
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/suppliers/${s.id}`}
                          className="p-1.5 text-gray-400 hover:text-[#7699F0] hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          {deletingId === s.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
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