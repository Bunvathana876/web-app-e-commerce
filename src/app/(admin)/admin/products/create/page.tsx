"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  X,
  Link2,
  Image as ImageIcon,
  Sparkles,
  Store,
} from "lucide-react";
import { productsApi, categoriesApi, sellersApi, uploadApi, ApiCategory, ApiSeller } from "@/lib/api";

const PRESET_IMAGES = [
  {
    name: "Headphones",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&fit=crop",
  },
  {
    name: "Smart Watch",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&fit=crop",
  },
  {
    name: "Keyboard",
    url: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600&fit=crop",
  },
  {
    name: "Running Shoes",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&fit=crop",
  },
  {
    name: "Backpack",
    url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&fit=crop",
  },
];

export default function CreateProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [sellers, setSellers] = useState<ApiSeller[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    seller_id: "",
    price: "",
    discount_price: "",
    stock: "",
    image_url: "",
    is_active: true,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const [catRes, sellerRes] = await Promise.all([
        categoriesApi.list(),
        sellersApi.list(),
      ]);

      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
        if (catRes.data.length > 0) {
          setForm((prev) => ({ ...prev, category_id: catRes.data[0].id.toString() }));
        }
      }

      if (sellerRes.success && Array.isArray(sellerRes.data)) {
        setSellers(sellerRes.data);
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP, GIF).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setError(null);
    setUploadingImage(true);

    try {
      const res = await uploadApi.uploadImage(file);
      if (res.success && res.data?.url) {
        setForm((prev) => ({ ...prev, image_url: res.data.url }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category_id: Number(form.category_id),
        seller_id: form.seller_id ? Number(form.seller_id) : undefined,
        price: parseFloat(form.price),
        discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
        stock: parseInt(form.stock, 10),
        image_url: form.image_url.trim() || undefined,
        is_active: form.is_active,
      };

      const res = await productsApi.create(payload);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/products");
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload local images or paste URLs & sync across pgAdmin 4, Web & Mobile
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <span>Product created successfully! Redirecting to products list...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Image Upload Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ImageIcon size={18} className="text-[#7699F0]" />
              Product Image
            </h2>
            <span className="text-xs text-gray-400">Local Upload or Direct URL</span>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#7699F0] bg-blue-50/50"
                : "border-gray-200 hover:border-[#7699F0] hover:bg-gray-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />

            {uploadingImage ? (
              <div className="py-6 flex flex-col items-center justify-center text-[#7699F0]">
                <Loader2 size={36} className="animate-spin mb-2" />
                <p className="text-sm font-medium">Uploading image to local server...</p>
                <p className="text-xs text-gray-400 mt-1">Saving to backend/uploads/products</p>
              </div>
            ) : form.image_url ? (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="relative inline-block">
                  <img
                    src={form.image_url}
                    alt="Product preview"
                    className="w-40 h-40 object-cover rounded-2xl border border-gray-200 shadow-sm mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/160x160?text=Preview+Error";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, image_url: "" }))}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition"
                    title="Remove Image"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
                  <CheckCircle2 size={14} /> Image selected & ready
                </p>
              </div>
            ) : (
              <div className="py-4 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#7699F0] flex items-center justify-center mx-auto">
                  <Upload size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Click to browse or drag & drop image here
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Supports PNG, JPG, WEBP or GIF (Max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Direct URL Input */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
              <Link2 size={13} /> Or Paste Direct Image URL
            </label>
            <input
              type="url"
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/... or http://localhost:8000/uploads/..."
              className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
            />
          </div>

          {/* Quick Presets */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <Sparkles size={13} className="text-amber-500" />
              <span>Quick Image Presets for Testing:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, image_url: preset.url }))}
                  className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-blue-50 hover:text-[#7699F0] text-gray-700 rounded-lg transition"
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Wireless Noise-Cancelling Headphones"
              required
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe features, specifications, and warranty..."
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] resize-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
              disabled={loadingCategories}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
            >
              {loadingCategories ? (
                <option>Loading categories...</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Store size={15} className="text-[#7699F0]" />
              Seller / Merchant Store
            </label>
            <select
              name="seller_id"
              value={form.seller_id}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
            >
              <option value="">Direct Store (Platform Owned)</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.owner_name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Pricing & Inventory</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="99.99"
                step="0.01"
                min="0.01"
                required
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Discount Price ($)
              </label>
              <input
                type="number"
                name="discount_price"
                value={form.discount_price}
                onChange={handleChange}
                placeholder="79.99"
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="50"
                min="0"
                required
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-lg">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#7699F0] rounded-xl hover:bg-blue-600 disabled:opacity-50 transition shadow-sm"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Saving to PostgreSQL..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}