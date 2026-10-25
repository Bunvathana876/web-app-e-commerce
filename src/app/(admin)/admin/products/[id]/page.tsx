"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  Edit3,
  Package,
  DollarSign,
  Boxes,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  X,
  Link2,
  Star,
  AlertTriangle,
  Store,
} from "lucide-react";
import {
  productsApi,
  categoriesApi,
  sellersApi,
  uploadApi,
  ApiProduct,
  ApiCategory,
  ApiSeller,
} from "@/lib/api";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const initialEdit = searchParams.get("edit") === "true";

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [sellers, setSellers] = useState<ApiSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isEditing, setIsEditing] = useState(initialEdit);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, selRes] = await Promise.all([
        productsApi.get(Number(id)),
        categoriesApi.list(),
        sellersApi.list(),
      ]);

      if (prodRes.success && prodRes.data) {
        const p = prodRes.data;
        setProduct(p);
        setForm({
          name: p.name || "",
          description: p.description || "",
          category_id: p.category_id ? p.category_id.toString() : "",
          seller_id: p.seller_id ? p.seller_id.toString() : "",
          price: p.price ? p.price.toString() : "0.00",
          discount_price: p.discount_price ? p.discount_price.toString() : "",
          stock: p.stock !== undefined ? p.stock.toString() : "0",
          image_url: p.image_url || "",
          is_active: p.is_active ?? true,
        });
      }
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
      if (selRes.success && selRes.data) {
        setSellers(selRes.data);
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to load product details.",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setNotification({
        type: "error",
        text: "Please upload an image file (PNG, JPG, WEBP, GIF).",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const res = await uploadApi.uploadImage(file);
      if (res.success && res.data?.url) {
        setForm((prev) => ({ ...prev, image_url: res.data.url }));
        setNotification({
          type: "success",
          text: "Image uploaded successfully to local server.",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to upload image.",
      });
    } finally {
      setUploadingImage(false);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category_id: Number(form.category_id),
        seller_id: form.seller_id ? Number(form.seller_id) : null,
        price: parseFloat(form.price),
        discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
        stock: parseInt(form.stock, 10),
        image_url: form.image_url.trim() || undefined,
        is_active: form.is_active,
      };

      const res = await productsApi.update(Number(id), payload);
      if (res.success && res.data) {
        setProduct(res.data);
        setIsEditing(false);
        setNotification({
          type: "success",
          text: "Product updated successfully in PostgreSQL database!",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to update product.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await productsApi.delete(Number(id));
      if (res.success) {
        router.push("/admin/products");
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to delete product.",
      });
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-[#7699F0]">
        <Loader2 size={36} className="animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">
          Loading product details from PostgreSQL...
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
        <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
        <p className="text-sm text-gray-500">
          The product you are looking for does not exist or has been deleted.
        </p>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7699F0] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition"
        >
          <ArrowLeft size={16} /> Back to Products Catalog
        </Link>
      </div>
    );
  }

  const priceNum = typeof product.price === "number" ? product.price : parseFloat(product.price || "0");
  const discountNum = product.discount_price ? (typeof product.discount_price === "number" ? product.discount_price : parseFloat(product.discount_price)) : null;
  const ratingNum = typeof product.rating === "number" ? product.rating : parseFloat(product.rating || "0");

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Product" : product.name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Product ID: #{product.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                <Edit3 size={16} />
                Edit Product
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setForm({
                    name: product.name || "",
                    description: product.description || "",
                    category_id: product.category_id ? product.category_id.toString() : "",
                    seller_id: product.seller_id ? product.seller_id.toString() : "",
                    price: product.price ? product.price.toString() : "0.00",
                    discount_price: product.discount_price ? product.discount_price.toString() : "",
                    stock: product.stock !== undefined ? product.stock.toString() : "0",
                    image_url: product.image_url || "",
                    is_active: product.is_active ?? true,
                  });
                  setIsEditing(false);
                }}
                className="px-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#7699F0] rounded-xl hover:bg-blue-600 disabled:opacity-50 transition"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm border ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:opacity-75 transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Regular Price</p>
              <p className="font-semibold text-gray-900">${priceNum.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 bg-blue-50">
              <Boxes size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Stock Available</p>
              <p className="font-semibold text-gray-900">{product.stock} units</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-600 bg-amber-50">
              <Star size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Rating</p>
              <p className="font-semibold text-gray-900">{ratingNum.toFixed(1)} / 5.0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-orange-600 bg-orange-50">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="font-semibold text-gray-900">
                {product.created_at
                  ? new Date(product.created_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Details & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image View & Image Edit */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">Product Photo</h3>

          <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center relative">
            {form.image_url || product.image_url ? (
              <img
                src={form.image_url || product.image_url || ""}
                alt={form.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/400x400?text=No+Image";
                }}
              />
            ) : (
              <div className="text-center p-4">
                <Package size={36} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No Image Provided</p>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="space-y-3 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#7699F0] border border-[#7699F0]/40 rounded-xl hover:bg-blue-50 transition"
              >
                {uploadingImage ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {uploadingImage ? "Uploading..." : "Upload New Image from PC"}
              </button>

              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Link2 size={11} /> Or Image URL:
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7699F0]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Product Info (View / Edit Form) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Product Information</h2>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
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
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id.toString()}>
                        {c.name}
                      </option>
                    ))}
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
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
                  >
                    <option value="">Direct Store (Platform Owned)</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id.toString()}>
                        {s.name} ({s.owner_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Status
                  </label>
                  <select
                    name="is_active"
                    value={form.is_active ? "true" : "false"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        is_active: e.target.value === "true",
                      }))
                    }
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
                  >
                    <option value="true">Active (Published)</option>
                    <option value="false">Inactive (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
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
                    step="0.01"
                    min="0"
                    placeholder="Optional discount"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
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
                    min="0"
                    required
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Description
                </p>
                <p className="mt-1.5 text-gray-700 leading-relaxed text-sm">
                  {product.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">Category</p>
                  <p className="mt-1 font-semibold text-gray-900 text-sm">
                    {product.category?.name || `Category #${product.category_id}`}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Seller / Store</p>
                  <p className="mt-1 font-semibold text-gray-900 text-sm">
                    {product.seller ? (
                      <Link
                        href={`/admin/sellers/${product.seller.id}`}
                        className="text-[#7699F0] hover:underline"
                      >
                        {product.seller.name || product.seller.owner_name}
                      </Link>
                    ) : (
                      "Direct Store"
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Discount Price</p>
                  <p className="mt-1 font-semibold text-gray-900 text-sm">
                    {discountNum ? `$${discountNum.toFixed(2)}` : "None"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      product.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        product.is_active ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    />
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Product</h3>
                <p className="text-xs text-gray-500">This action is permanent.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">&ldquo;{product.name}&rdquo;</span>{" "}
              (ID: #{product.id}) from PostgreSQL?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
              >
                {deleting && <Loader2 size={15} className="animate-spin" />}
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}