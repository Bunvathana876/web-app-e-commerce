"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  Save,
  Shield,
  Lock,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  ImagePlus,
  CheckCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { sellersApi, type ApiUser } from "@/lib/api";

function canCreateSeller(user: ApiUser | null): boolean {
  if (!user) return false;
  return user.role === "super_admin" || user.role === "admin";
}

const emptyForm = {
  storeName: "",
  ownerName: "",
  email: "",
  phone: "",
  address: "",
  description: "",
  logo: "",
  status: "Pending",
  password: "",
  confirmPassword: "",
};

export default function CreateSellerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    setCurrentUser(u);
    setAuthChecked(true);
  }, []);

  // ── Access guard ──────────────────────────────────────────────────────────
  if (authChecked && !canCreateSeller(currentUser)) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
          <Lock size={36} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 mt-2">
            Only <strong>Super Admin</strong> or <strong>Admin</strong> can
            create new seller accounts.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/admin/sellers"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <ArrowLeft size={16} />
            Back to Sellers
          </Link>
        </div>
        <p className="text-xs text-gray-400">
          Your current role:{" "}
          <span className="font-semibold capitalize">
            {currentUser?.role ?? "Unknown"}
          </span>
        </p>
      </div>
    );
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.storeName.trim()) e.storeName = "Store name is required";
    if (!form.ownerName.trim()) e.ownerName = "Owner name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email address";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const res = await sellersApi.create({
        name: form.storeName.trim(),
        owner_name: form.ownerName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        description: form.description.trim() || undefined,
        logo: form.logo.trim() || undefined,
        status: form.status,
        password: form.password,
      });

      if (res.success) {
        setSaving(false);
        setSuccess(true);
        setTimeout(() => router.push("/admin/sellers"), 1500);
      } else {
        setServerError(res.message || "Failed to create seller");
        setSaving(false);
      }
    } catch (err: any) {
      setServerError(err.message || "An unexpected error occurred while creating seller.");
      setSaving(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto animate-bounce-once">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Seller Created in PostgreSQL!</h2>
        <p className="text-gray-500">
          <strong>{form.storeName}</strong> has been registered successfully in database.
          Redirecting to sellers list…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/sellers"
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Add New Seller
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-[#7699F0] rounded-lg">
                <Shield size={11} />
                Admin Only
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Create a new seller account and store profile
            </p>
          </div>
        </div>

        <button
          form="create-seller-form"
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#7699F0] rounded-xl hover:bg-blue-600 disabled:opacity-60 transition shadow-sm"
        >
          <Save size={16} />
          {saving ? "Creating…" : "Create Seller"}
        </button>
      </div>

      {serverError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{serverError}</span>
          <button
            type="button"
            onClick={() => setServerError(null)}
            className="text-red-500 hover:text-red-700 p-1"
          >
            ✕
          </button>
        </div>
      )}

      <form id="create-seller-form" onSubmit={handleSubmit} className="space-y-6">
        {/* ── Store Information ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Store size={16} className="text-[#7699F0]" />
            </div>
            <h2 className="font-semibold text-gray-900">Store Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Store Name <span className="text-red-500">*</span>
              </label>
              <input
                name="storeName"
                value={form.storeName}
                onChange={handleChange}
                placeholder="e.g. TechHub Cambodia"
                className={`w-full px-4 py-2.5 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition ${
                  errors.storeName ? "border-red-300 bg-red-50" : "border-gray-200"
                }`}
              />
              {errors.storeName && (
                <p className="mt-1 text-xs text-red-500">{errors.storeName}</p>
              )}
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
                <option value="Pending">Pending Review</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <ImagePlus size={13} className="inline mr-1" />
                Logo URL
              </label>
              <input
                name="logo"
                value={form.logo}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <MapPin size={13} className="inline mr-1" />
                Address
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Street, City, Province"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <FileText size={13} className="inline mr-1" />
                Store Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Brief description of the store and products offered…"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] resize-none transition"
              />
            </div>
          </div>
        </div>

        {/* ── Owner / Account ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <User size={16} className="text-violet-600" />
            </div>
            <h2 className="font-semibold text-gray-900">
              Owner & Account Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Owner Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  placeholder="Full name"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition ${
                    errors.ownerName ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.ownerName && (
                <p className="mt-1 text-xs text-red-500">{errors.ownerName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+855 12 345 678"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition ${
                    errors.phone ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="seller@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition ${
                    errors.email ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className={`w-full px-4 py-2.5 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition ${
                  errors.password ? "border-red-300 bg-red-50" : "border-gray-200"
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                className={`w-full px-4 py-2.5 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition ${
                  errors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-200"
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Admin-only notice ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm">
          <Shield size={16} className="mt-0.5 flex-shrink-0 text-[#7699F0]" />
          <div>
            <p className="font-semibold text-[#7699F0]">Admin Action</p>
            <p className="text-blue-700 mt-0.5">
              You are creating this seller as{" "}
              <strong>{currentUser?.name ?? "Admin"}</strong> (
              {currentUser?.role}). The seller will receive login credentials
              and can manage their own profile after activation.
            </p>
          </div>
        </div>

        {/* ── Submit row ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/sellers"
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#7699F0] rounded-xl hover:bg-blue-600 disabled:opacity-60 transition shadow-sm"
          >
            <Save size={16} />
            {saving ? "Creating Seller…" : "Create Seller"}
          </button>
        </div>
      </form>
    </div>
  );
}
