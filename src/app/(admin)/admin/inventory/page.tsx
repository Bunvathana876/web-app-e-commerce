"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Eye,
  Boxes,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Package,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { productsApi, ApiProduct } from "@/lib/api";

const statusFilters = ["All", "In Stock", "Low Stock", "Out of Stock"];

export default function InventoryPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productsApi.list({ limit: 100 });
      if (res.success && res.data) {
        setProducts(res.data.items || []);
      }
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getProductStatus = (stock: number) => {
    if (stock <= 0) return "Out of Stock";
    if (stock <= 10) return "Low Stock";
    return "In Stock";
  };

  const filtered = products.filter((item) => {
    const status = getProductStatus(item.stock);
    const sku = `SKU-${item.id.toString().padStart(4, "0")}`;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      sku.toLowerCase().includes(search.toLowerCase()) ||
      (item.category?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: products.length,
    inStock: products.filter((i) => getProductStatus(i.stock) === "In Stock").length,
    lowStock: products.filter((i) => getProductStatus(i.stock) === "Low Stock").length,
    outOfStock: products.filter((i) => getProductStatus(i.stock) === "Out of Stock").length,
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-emerald-50 text-emerald-700";
      case "Low Stock":
        return "bg-amber-50 text-amber-700";
      case "Out of Stock":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-emerald-500";
      case "Low Stock":
        return "bg-amber-500";
      case "Out of Stock":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStockColor = (stock: number) => {
    if (stock <= 0) return "text-red-600";
    if (stock <= 10) return "text-amber-600";
    return "text-gray-900";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Live product stock tracking directly synced with PostgreSQL database
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <Boxes className="text-[#7699F0]" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Package className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Stock</p>
              <p className="text-xl font-bold text-gray-900">{stats.inStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-xl font-bold text-gray-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingDown className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-xl font-bold text-gray-900">{stats.outOfStock}</p>
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
            placeholder="Search by product name, SKU, or category..."
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

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin text-[#7699F0] mb-2" size={32} />
            <p className="text-sm">Loading inventory from database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50/70">
                  <th className="font-medium px-6 py-4">Product</th>
                  <th className="font-medium px-6 py-4">SKU</th>
                  <th className="font-medium px-6 py-4">Category</th>
                  <th className="font-medium px-6 py-4">Current Stock</th>
                  <th className="font-medium px-6 py-4">Status</th>
                  <th className="font-medium px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => {
                  const status = getProductStatus(item.stock);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.image_url ||
                              "https://placehold.co/80x80?text=Product"
                            }
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-100"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://placehold.co/80x80?text=Product";
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-400">${Number(item.price).toFixed(2)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                        SKU-{item.id.toString().padStart(4, "0")}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {item.category?.name || "General"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold ${getStockColor(item.stock)}`}
                        >
                          {item.stock}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">units</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            status
                          )}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${getStatusDot(
                              status
                            )}`}
                          />
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/products`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#7699F0] bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                        >
                          <Eye size={15} />
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Boxes className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-600 font-medium">No items found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try changing your search or filter
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