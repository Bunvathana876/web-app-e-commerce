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
  Calendar,
  ShoppingBag,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Shield,
} from "lucide-react";
import { usersApi, ordersApi, ApiUser, ApiOrder } from "@/lib/api";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const userId = Number(id);

  const [customer, setCustomer] = useState<ApiUser | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
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
    email: "",
    phone: "",
    role: "customer",
    is_active: true,
  });

  const loadCustomerData = useCallback(async () => {
    if (isNaN(userId)) {
      setNotification({ type: "error", text: "Invalid Customer ID format." });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [userRes, ordersRes] = await Promise.all([
        usersApi.get(userId),
        ordersApi.list(),
      ]);

      if (userRes.success && userRes.data) {
        const u = userRes.data;
        setCustomer(u);
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          role: u.role || "customer",
          is_active: u.is_active ?? true,
        });
      } else {
        setNotification({
          type: "error",
          text: userRes.message || "Customer not found.",
        });
      }

      if (ordersRes.success && ordersRes.data) {
        const userOrders = ordersRes.data.filter((o) => o.user_id === userId);
        setOrders(userOrders);
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to load customer details from PostgreSQL.",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "is_active") {
      setForm((prev) => ({ ...prev, is_active: value === "true" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      const res = await usersApi.update(userId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        is_active: form.is_active,
      });

      if (res.success && res.data) {
        setCustomer(res.data);
        setIsEditing(false);
        setNotification({
          type: "success",
          text: "Customer profile updated successfully in PostgreSQL database!",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to update customer in database.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete user #${userId}?`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await usersApi.delete(userId);
      if (res.success) {
        router.push("/admin/customers");
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to delete user.",
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-[#7699F0]">
        <Loader2 size={36} className="animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">
          Loading customer record from PostgreSQL...
        </p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Customer Not Found</h2>
        <p className="text-sm text-gray-500">
          User #{id} was not found in PostgreSQL database.
        </p>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7699F0] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition"
        >
          <ArrowLeft size={16} /> Back to Customers
        </Link>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const createdDate = customer.created_at
    ? new Date(customer.created_at).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Customer" : customer.name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">PostgreSQL User ID: #{customer.id}</p>
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
                    name: customer.name || "",
                    email: customer.email || "",
                    phone: customer.phone || "",
                    role: customer.role || "customer",
                    is_active: customer.is_active ?? true,
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#7699F0]">
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{orders.length} orders</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Member Since</p>
              <p className="text-base font-semibold text-gray-900">{createdDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details or Edit Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-gray-900">User Information</h2>

        {isEditing ? (
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
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
                placeholder="+855..."
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Account Status
              </label>
              <select
                name="is_active"
                value={form.is_active ? "true" : "false"}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              >
                <option value="true">Active (Enabled)</option>
                <option value="false">Inactive (Disabled)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              >
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Email Address</p>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Mail size={15} className="text-[#7699F0]" />
                {customer.email}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Phone size={15} className="text-emerald-500" />
                {customer.phone || "Not provided"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-400">Role</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 uppercase">
                <Shield size={12} /> {customer.role}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-400">Account Status</p>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  customer.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    customer.is_active ? "bg-emerald-500" : "bg-gray-400"
                  }`}
                />
                {customer.is_active ? "Active" : "Disabled"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Customer Orders History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Orders History from PostgreSQL</h2>

        {orders.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No orders found for this customer in database.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-semibold text-[#7699F0]">
                      #{o.id}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      ${Number(o.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-xs font-semibold text-[#7699F0] hover:underline"
                      >
                        View Order →
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