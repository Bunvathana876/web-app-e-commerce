"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Plus,
  Minus,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { productsApi, ApiProduct } from "@/lib/api";

export default function InventoryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const productId = Number(id);

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [reason, setReason] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const lowStockThreshold = 10;

  const loadProduct = useCallback(async () => {
    if (isNaN(productId)) {
      setNotification({ type: "error", text: "Invalid Product ID." });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await productsApi.get(productId);
      if (res.success && res.data) {
        setProduct(res.data);
      } else {
        setNotification({ type: "error", text: res.message || "Product not found." });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to load product from PostgreSQL.",
      });
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const amount = parseInt(adjustAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setNotification({ type: "error", text: "Please enter a valid stock amount." });
      return;
    }

    const currentStock = Number(product.stock) || 0;
    const newStock =
      adjustType === "add" ? currentStock + amount : Math.max(0, currentStock - amount);

    setSaving(true);
    setNotification(null);

    try {
      const res = await productsApi.update(productId, { stock: newStock });
      if (res.success && res.data) {
        setProduct(res.data);
        setAdjustAmount("");
        setReason("");
        setNotification({
          type: "success",
          text: `Stock successfully updated to ${newStock} units in PostgreSQL database!`,
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to update stock in database.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-[#7699F0]">
        <Loader2 size={36} className="animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">
          Loading inventory record from PostgreSQL...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Inventory Item Not Found</h2>
        <p className="text-sm text-gray-500">
          Product ID #{id} was not found in PostgreSQL database.
        </p>
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7699F0] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition"
        >
          <ArrowLeft size={16} /> Back to Inventory
        </Link>
      </div>
    );
  }

  const stock = Number(product.stock) || 0;
  const currentStatus =
    stock === 0 ? "Out of Stock" : stock <= lowStockThreshold ? "Low Stock" : "In Stock";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/inventory"
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Stock</h1>
            <p className="text-sm text-gray-500 mt-0.5">PostgreSQL Product #{product.id}</p>
          </div>
        </div>

        <Link
          href={`/admin/products/${product.id}`}
          className="px-4 py-2 text-sm font-medium text-[#7699F0] bg-blue-50 hover:bg-blue-100 rounded-xl transition"
        >
          View Full Product →
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

      {/* Product Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package size={28} className="text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Category: {product.category?.name || `#${product.category_id}`} · Price: $
              {Number(product.price).toFixed(2)}
            </p>
            <span
              className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                currentStatus === "In Stock"
                  ? "bg-emerald-50 text-emerald-700"
                  : currentStatus === "Low Stock"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  currentStatus === "In Stock"
                    ? "bg-emerald-500"
                    : currentStatus === "Low Stock"
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
              />
              {currentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Stock Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <p className="text-sm text-gray-500">Current Stock</p>
          <p
            className={`text-3xl font-bold mt-1 ${
              stock === 0
                ? "text-red-600"
                : stock <= lowStockThreshold
                ? "text-amber-600"
                : "text-gray-900"
            }`}
          >
            {stock}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <p className="text-sm text-gray-500">Low Stock Alert Threshold</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{lowStockThreshold}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <p className="text-sm text-gray-500">Listing Status</p>
          <p className="text-3xl font-bold text-[#7699F0] mt-1">
            {product.is_active ? "Active" : "Hidden"}
          </p>
        </div>
      </div>

      {/* Stock Adjustment Form */}
      <form
        onSubmit={handleAdjust}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5"
      >
        <h2 className="font-semibold text-gray-900">Adjust Stock in Database</h2>

        {/* Type Toggle */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setAdjustType("add")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition ${
              adjustType === "add"
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Plus size={16} /> Add Stock (Restock)
          </button>
          <button
            type="button"
            onClick={() => setAdjustType("remove")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition ${
              adjustType === "remove"
                ? "bg-red-50 border-red-300 text-red-700"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Minus size={16} /> Remove Stock (Defect / Loss)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="e.g. 20"
              required
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason / Memo (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Shipment delivered from warehouse"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
            />
          </div>
        </div>

        {adjustAmount && Number(adjustAmount) > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
            Preview: Stock will change from <strong>{stock}</strong> to{" "}
            <strong>
              {adjustType === "add"
                ? stock + Number(adjustAmount)
                : Math.max(0, stock - Number(adjustAmount))}
            </strong>{" "}
            units in PostgreSQL.
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || !adjustAmount}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#7699F0] rounded-xl hover:bg-blue-600 disabled:opacity-50 transition shadow-sm"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Updating PostgreSQL..." : "Save Stock Adjustment"}
          </button>
        </div>
      </form>
    </div>
  );
}