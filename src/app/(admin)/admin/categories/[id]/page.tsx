"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  Edit3,
  Package,
  Calendar,
  FolderOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  X,
  Link2,
  AlertTriangle,
  Eye,
  Plus,
} from "lucide-react";
import {
  categoriesApi,
  productsApi,
  uploadApi,
  ApiCategory,
  ApiProduct,
} from "@/lib/api";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const initialEdit = searchParams.get("edit") === "true";

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<ApiCategory | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
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
    image: "",
    is_active: true,
  });

  const loadCategoryData = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, prodRes] = await Promise.all([
        categoriesApi.get(Number(id)),
        productsApi.list({ category_id: Number(id), limit: 50 }),
      ]);

      if (catRes.success && catRes.data) {
        const c = catRes.data;
        setCategory(c);
        setForm({
          name: c.name || "",
          description: c.description || "",
          image: c.image || "",
          is_active: c.is_active ?? true,
        });
      }

      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data.items || []);
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to load category details.",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCategoryData();
  }, [loadCategoryData]);

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
        setForm((prev) => ({ ...prev, image: res.data.url }));
        setNotification({
          type: "success",
          text: "Category image uploaded to local server.",
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
        image: form.image.trim() || undefined,
        is_active: form.is_active,
      };

      const res = await categoriesApi.update(Number(id), payload);
      if (res.success && res.data) {
        setCategory(res.data);
        setIsEditing(false);
        setNotification({
          type: "success",
          text: "Category updated successfully in PostgreSQL database!",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to update category.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await categoriesApi.delete(Number(id));
      if (res.success) {
        router.push("/admin/categories");
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to delete category.",
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
          Loading category from PostgreSQL database...
        </p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Category Not Found</h2>
        <p className="text-sm text-gray-500">
          The category you are looking for does not exist or has been deleted.
        </p>
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7699F0] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition"
        >
          <ArrowLeft size={16} /> Back to Categories List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/categories"
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Category" : category.name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Category ID: #{category.id}</p>
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
                Edit Category
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
                    name: category.name || "",
                    description: category.description || "",
                    image: category.image || "",
                    is_active: category.is_active ?? true,
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#7699F0]">
              <Package size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Products in Category</p>
              <p className="text-xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FolderOpen size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Visibility Status</p>
              <p className="text-xl font-bold text-gray-900">
                {category.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Created Date</p>
              <p className="text-lg font-bold text-gray-900">
                {category.created_at
                  ? new Date(category.created_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Info & Edit Form */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Image View & Image Edit */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">Category Photo</h3>

          <div className="aspect-video rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center relative">
            {form.image || category.image ? (
              <img
                src={form.image || category.image || ""}
                alt={form.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/400x250?text=No+Image";
                }}
              />
            ) : (
              <div className="text-center p-4">
                <FolderOpen size={36} className="text-gray-300 mx-auto mb-2" />
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
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7699F0]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Category Info (View / Edit Form) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Category Information</h2>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category Name <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Visibility Status
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
                  <option value="true">Active (Visible in Store)</option>
                  <option value="false">Inactive (Hidden)</option>
                </select>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Description
                </p>
                <p className="mt-1.5 text-gray-700 leading-relaxed text-sm">
                  {category.description || "No description provided for this category."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">Total Products</p>
                  <p className="mt-1 font-semibold text-gray-900 text-sm">
                    {products.length} products listed
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      category.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        category.is_active ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    />
                    {category.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products under this Category section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Products in this Category ({products.length})
            </h2>
            <p className="text-xs text-gray-500">Live products linked to {category.name}</p>
          </div>
          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7699F0] text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition"
          >
            <Plus size={14} /> Add Product
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
            No products currently added to this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((p) => {
              const price = typeof p.price === "number" ? p.price : parseFloat(p.price || "0");
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-gray-100 hover:border-[#7699F0]/40 transition flex items-center justify-between gap-3 bg-gray-50/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.image_url || "https://placehold.co/60x60?text=Product"}
                      alt={p.name}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 font-semibold">${price.toFixed(2)} • {p.stock} in stock</p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="p-2 text-gray-400 hover:text-[#7699F0] hover:bg-white rounded-lg transition"
                    title="View Product"
                  >
                    <Eye size={16} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
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
                <h3 className="text-lg font-bold text-gray-900">Delete Category</h3>
                <p className="text-xs text-gray-500">This will remove the category from PostgreSQL.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">&ldquo;{category.name}&rdquo;</span>{" "}
              (ID: #{category.id})?
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