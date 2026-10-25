"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Edit3,
  Mail,
  Phone,
  Truck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { sellersApi, productsApi, ApiSeller, ApiProduct } from "@/lib/api";

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supplierId = Number(id);

  const [supplier, setSupplier] = useState<ApiSeller | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: "",
    owner_name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    status: "Active",
  });

  const loadData = useCallback(async () => {
    if (isNaN(supplierId)) {
      setNotification({ type: "error", text: "Invalid Supplier ID format." });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [supRes, prodRes] = await Promise.all([
        sellersApi.get(supplierId),
        productsApi.list(),
      ]);

      if (supRes.success && supRes.data) {
        const s = supRes.data;
        setSupplier(s);
        setForm({
          name: s.name || "",
          owner_name: s.owner_name || "",
          email: s.email || "",
          phone: s.phone || "",
          address: s.address || "",
          description: s.description || "",
          status: s.status || "Active",
        });
      } else {
        setNotification({
          type: "error",
          text: supRes.message || "Supplier not found.",
        });
      }

      if (prodRes.success && prodRes.data) {
        const supplied = prodRes.data.items.filter((p: ApiProduct) => p.seller_id === supplierId);
        setProducts(supplied);
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to load supplier details from PostgreSQL.",
      });
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      const res = await sellersApi.update(supplierId, {
        name: form.name.trim(),
        owner_name: form.owner_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        description: form.description.trim() || undefined,
        status: form.status,
      });

      if (res.success && res.data) {
        setSupplier(res.data);
        setIsEditing(false);
        setNotification({
          type: "success",
          text: "Supplier updated successfully in PostgreSQL database!",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to update supplier.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete supplier #${supplierId}?`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await sellersApi.delete(supplierId);
      if (res.success) {
        router.push("/admin/suppliers");
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to delete supplier.",
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-[#7699F0]">
        <Loader2 size={36} className="animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">
          Loading supplier from PostgreSQL...
        </p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Supplier Not Found</h2>
        <p className="text-sm text-gray-500">
          Supplier #{id} does not exist in PostgreSQL.
        </p>
        <Link
          href="/admin/suppliers"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7699F0] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition"
        >
          <ArrowLeft size={16} /> Back to Suppliers
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/suppliers"
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Supplier" : supplier.name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">PostgreSQL ID: #{supplier.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                <Edit3 size={16} /> Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setForm({
                    name: supplier.name || "",
                    owner_name: supplier.owner_name || "",
                    email: supplier.email || "",
                    phone: supplier.phone || "",
                    address: supplier.address || "",
                    description: supplier.description || "",
                    status: supplier.status || "Active",
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
                Save Changes
              </button>
            </>
          )}
        </div>
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

      {/* Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#7699F0] flex items-center justify-center font-bold text-xl">
            <Truck size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{supplier.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  supplier.status.toLowerCase() === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    supplier.status.toLowerCase() === "active"
                      ? "bg-emerald-500"
                      : "bg-gray-400"
                  }`}
                />
                {supplier.status}
              </span>
              <span className="text-xs text-gray-400">
                Partner since {new Date(supplier.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details or Edit Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-gray-900">Supplier Profile</h2>

        {isEditing ? (
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="owner_name"
                value={form.owner_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Address
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes & Terms
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Contact Person</p>
              <p className="text-sm font-semibold text-gray-900">{supplier.owner_name}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-400">Email Address</p>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Mail size={15} className="text-[#7699F0]" />
                {supplier.email}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Phone size={15} className="text-emerald-500" />
                {supplier.phone || "Not provided"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-400">Address</p>
              <p className="text-sm text-gray-700">{supplier.address || "Not provided"}</p>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <p className="text-xs text-gray-400">Notes</p>
              <p className="text-sm text-gray-700">{supplier.description || "No notes provided."}</p>
            </div>
          </div>
        )}
      </div>

      {/* Supplied Products */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Products from this Supplier ({products.length})</h2>

        {products.length === 0 ? (
          <p className="text-sm text-gray-400 py-3 text-center">
            No products associated with this supplier in PostgreSQL.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">${Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{p.stock} units</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-xs font-semibold text-[#7699F0] hover:underline"
                      >
                        Details →
                      </Link>
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