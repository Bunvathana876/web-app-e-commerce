"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Trash2,
  FolderOpen,
  RefreshCw,
  Tag,
  Eye,
  Edit,
  Upload,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { categoriesApi, uploadApi, ApiCategory } from "@/lib/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Add Category modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatImage, setNewCatImage] = useState("");
  const [newCatActive, setNewCatActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingCat, setSavingCat] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [catToDelete, setCatToDelete] = useState<ApiCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoriesApi.list(false);
      setCategories(res.data || []);
    } catch (err: any) {
      console.error("Failed to load categories:", err);
      setNotification({
        type: "error",
        text: err.message || "Failed to load categories from database.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setNotification({
        type: "error",
        text: "Please select a valid image file (PNG, JPG, WEBP, GIF).",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const res = await uploadApi.uploadImage(file);
      if (res.success && res.data?.url) {
        setNewCatImage(res.data.url);
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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSavingCat(true);
    setNotification(null);

    try {
      const res = await categoriesApi.create({
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
        image: newCatImage.trim() || undefined,
        is_active: newCatActive,
      });
      setCategories((prev) => [...prev, res.data]);
      setShowAddModal(false);
      setNewCatName("");
      setNewCatDesc("");
      setNewCatImage("");
      setNewCatActive(true);
      setNotification({
        type: "success",
        text: `Category "${res.data.name}" created successfully!`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to create category",
      });
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!catToDelete) return;
    setDeleting(true);

    try {
      await categoriesApi.delete(catToDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== catToDelete.id));
      setNotification({
        type: "success",
        text: `Category "${catToDelete.name}" was deleted successfully.`,
      });
      setCatToDelete(null);
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to delete category.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = categories.filter((cat) => {
    const matchSearch = cat.name.toLowerCase().includes(search.toLowerCase());
    const isAct = cat.is_active ? "Active" : "Inactive";
    const matchStatus = statusFilter === "All" || isAct === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} categories available in PostgreSQL database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCategories}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7699F0] text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={18} />
            Add Category
          </button>
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
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
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

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search categories by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", "Active", "Inactive"].map((status) => (
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

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-[#7699F0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading categories from PostgreSQL...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((category) => (
            <div
              key={category.id}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              {/* Image & Header */}
              <div>
                <div className="relative h-40 bg-gray-100 overflow-hidden flex items-center justify-center">
                  {category.image ? (
                    <img
                      src={
                        category.image.startsWith("http")
                          ? category.image
                          : `https://placehold.co/400x200?text=${encodeURIComponent(category.name)}`
                      }
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/400x200?text=Category";
                      }}
                    />
                  ) : (
                    <Tag className="text-gray-300" size={36} />
                  )}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                        category.is_active
                          ? "bg-emerald-500/90 text-white"
                          : "bg-gray-500/90 text-white"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {category.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 pt-3 flex items-center justify-between border-t border-gray-100 mt-auto">
                <span className="text-xs font-mono text-gray-400">ID: #{category.id}</span>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="p-2 text-gray-400 hover:text-[#7699F0] hover:bg-blue-50 rounded-xl transition"
                    title="View Category & Products"
                  >
                    <Eye size={16} />
                  </Link>
                  <Link
                    href={`/admin/categories/${category.id}?edit=true`}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                    title="Edit Category"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => setCatToDelete(category)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Delete Category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="text-gray-300" size={32} />
          </div>
          <p className="text-gray-600 font-medium">No categories found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your search or create a new category
          </p>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add New Category</h3>
                <p className="text-xs text-gray-500">
                  Save new category directly to PostgreSQL database
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              {/* Category Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Category Image
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                    isDragging
                      ? "border-[#7699F0] bg-blue-50/50"
                      : "border-gray-200 hover:border-[#7699F0]"
                  }`}
                >
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

                  {uploadingImage ? (
                    <div className="py-2 flex flex-col items-center justify-center text-[#7699F0]">
                      <Loader2 size={24} className="animate-spin mb-1" />
                      <p className="text-xs">Uploading image to server...</p>
                    </div>
                  ) : newCatImage ? (
                    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                      <img
                        src={newCatImage}
                        alt="Preview"
                        className="h-24 object-cover rounded-lg border border-gray-200 mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => setNewCatImage("")}
                        className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full shadow"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 py-1">
                      <Upload size={16} className="text-[#7699F0]" />
                      <span>Drag image here or click to browse</span>
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <input
                    type="url"
                    value={newCatImage}
                    onChange={(e) => setNewCatImage(e.target.value)}
                    placeholder="Or paste image URL (https://...)"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7699F0]"
                  />
                </div>
              </div>

              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Smart Watches & Wearables"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Short description of this category..."
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newCatActive ? "true" : "false"}
                  onChange={(e) => setNewCatActive(e.target.value === "true")}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
                >
                  <option value="true">Active (Visible)</option>
                  <option value="false">Inactive (Hidden)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCat || uploadingImage}
                  className="px-5 py-2.5 text-sm font-semibold bg-[#7699F0] text-white rounded-xl hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {savingCat ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {savingCat ? "Saving to Database..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {catToDelete && (
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
              Are you sure you want to delete category{" "}
              <span className="font-semibold text-gray-900">&ldquo;{catToDelete.name}&rdquo;</span>{" "}
              (ID: #{catToDelete.id})?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setCatToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCategory}
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