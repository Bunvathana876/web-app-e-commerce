"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  X,
  Link2,
  FolderOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { categoriesApi, uploadApi } from "@/lib/api";

export default function CreateCategoryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    is_active: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, WEBP, GIF).");
      return;
    }

    setError(null);
    setUploadingImage(true);

    try {
      const res = await uploadApi.uploadImage(file);
      if (res.success && res.data?.url) {
        setForm((prev) => ({ ...prev, image: res.data.url }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload category image.");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        image: form.image.trim() || undefined,
        is_active: form.is_active,
      };

      const res = await categoriesApi.create(payload);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/categories");
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create category in PostgreSQL.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/categories"
          className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Category</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create a category and store it directly in PostgreSQL database
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
          <span>Category created successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Image */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FolderOpen size={18} className="text-[#7699F0]" />
            Category Image
          </h2>

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
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
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
              <div className="py-4 flex flex-col items-center justify-center text-[#7699F0]">
                <Loader2 size={32} className="animate-spin mb-2" />
                <p className="text-sm font-medium">Uploading to local server...</p>
              </div>
            ) : form.image ? (
              <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                <img
                  src={form.image}
                  alt="Category preview"
                  className="h-36 object-cover rounded-xl border border-gray-200 shadow-sm mx-auto"
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="py-3 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#7699F0] flex items-center justify-center mx-auto">
                  <Upload size={22} />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  Click to upload or drag & drop category image
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, WEBP or GIF</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Link2 size={12} /> Or Direct Image URL:
            </label>
            <input
              type="url"
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Category Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Smart Watches"
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
              rows={3}
              placeholder="Describe this product category..."
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] resize-none"
            />
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
              <option value="true">Active (Visible)</option>
              <option value="false">Inactive (Hidden)</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-lg">
          <Link
            href="/admin/categories"
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
            {submitting ? "Saving to PostgreSQL..." : "Save Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
