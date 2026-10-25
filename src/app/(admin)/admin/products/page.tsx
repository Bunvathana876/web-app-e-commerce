"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  RefreshCw,
  Store,
} from "lucide-react";
import { productsApi, categoriesApi, ApiProduct, ApiCategory } from "@/lib/api";

const statusFilters = ["All", "Active", "Low Stock", "Out of Stock"];

export default function ProductsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsApi.list({ limit: 100 }),
        categoriesApi.list(),
      ]);
      setProducts(prodRes.data?.items || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      await productsApi.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === "All" || p.category_id.toString() === selectedCategory;

    let pStatus = "Active";
    if (p.stock === 0) pStatus = "Out of Stock";
    else if (p.stock < 15) pStatus = "Low Stock";

    const matchStatus = statusFilter === "All" || pStatus === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredProducts.length} products found in database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <Link
            href="/admin/products/create"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7699F0] text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={18} />
            Add Product
          </Link>
        </div>
      </div>

      {/* Search + Status Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-[#7699F0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading products from backend...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50/70">
                  <th className="font-medium px-6 py-4">Product</th>
                  <th className="font-medium px-6 py-4">Category</th>
                  <th className="font-medium px-6 py-4">Seller / Store</th>
                  <th className="font-medium px-6 py-4">Price</th>
                  <th className="font-medium px-6 py-4">Stock</th>
                  <th className="font-medium px-6 py-4">Rating</th>
                  <th className="font-medium px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const price = typeof product.price === "number" ? product.price : parseFloat(product.price || "0");
                  const rating = typeof product.rating === "number" ? product.rating : parseFloat(product.rating || "0");

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 flex items-center justify-center">
                            {product.image_url ? (
                              <img
                                src={
                                  product.image_url.startsWith("http")
                                    ? product.image_url
                                    : `https://placehold.co/100x100?text=${encodeURIComponent(product.name.slice(0, 3))}`
                                }
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://placehold.co/100x100?text=Product";
                                }}
                              />
                            ) : (
                              <Package size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-50">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">#{product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {product.category?.name || `Category #${product.category_id}`}
                      </td>
                      <td className="px-6 py-4">
                        {product.seller ? (
                          <Link
                            href={`/admin/sellers/${product.seller.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition"
                          >
                            <Store size={12} className="text-[#7699F0]" />
                            <span>{product.seller.name}</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">Direct Store</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ${price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${
                            product.stock === 0
                              ? "text-red-600"
                              : product.stock < 15
                              ? "text-amber-600"
                              : "text-gray-700"
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          ★ {rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-2 rounded-lg text-gray-400 hover:text-[#7699F0] hover:bg-blue-50 transition-all"
                            title="View Product"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}?edit=true`}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Edit Product"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={deletingId === product.id}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-40"
                            title="Delete"
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
        {!loading && filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Package className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-600 font-medium">No products found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try changing your search or filter criteria
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredProducts.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium">1–{filteredProducts.length}</span> of{" "}
              <span className="font-medium">{filteredProducts.length}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}