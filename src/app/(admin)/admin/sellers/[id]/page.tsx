"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Edit3,
  Mail,
  Phone,
  Package,
  ShoppingCart,
  Star,
  Calendar,
  MapPin,
  Store,
  Shield,
  Lock,
  X,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { sellersApi, productsApi, type ApiSeller, type ApiProduct, type ApiUser } from "@/lib/api";

function canCreateSeller(user: ApiUser | null) {
  if (!user) return false;
  return user.role === "super_admin" || user.role === "admin";
}

function canEdit(user: ApiUser | null) {
  return !!user;
}

function canChangeStatus(user: ApiUser | null) {
  return canCreateSeller(user);
}

export default function SellerDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const sellerId = Number(id);

  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [seller, setSeller] = useState<ApiSeller | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "1");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit form state
  const [form, setForm] = useState({
    name: "",
    owner_name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    logo: "",
    status: "Active",
  });

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const loadSellerData = useCallback(async () => {
    if (isNaN(sellerId)) {
      setError("Invalid seller ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [sellerRes, prodRes] = await Promise.allSettled([
        sellersApi.get(sellerId),
        productsApi.list({ limit: 6 }),
      ]);

      if (sellerRes.status === "fulfilled" && sellerRes.value.success) {
        const s = sellerRes.value.data;
        setSeller(s);
        setForm({
          name: s.name || "",
          owner_name: s.owner_name || "",
          email: s.email || "",
          phone: s.phone || "",
          address: s.address || "",
          description: s.description || "",
          logo: s.logo || "",
          status: s.status || "Active",
        });
      } else {
        setError("Seller not found in database.");
      }

      if (prodRes.status === "fulfilled" && prodRes.value.success) {
        setProducts(prodRes.value.data.items || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load seller from database.");
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    loadSellerData();
  }, [loadSellerData]);

  useEffect(() => {
    if (searchParams.get("edit") === "1") {
      setIsEditing(true);
    }
  }, [searchParams]);

  const isAdmin = canCreateSeller(currentUser);
  const userCanEdit = canEdit(currentUser);
  const userCanChangeStatus = canChangeStatus(currentUser);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!seller) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await sellersApi.update(seller.id, {
        name: form.name.trim(),
        owner_name: form.owner_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        description: form.description.trim() || undefined,
        logo: form.logo.trim() || undefined,
        status: userCanChangeStatus ? form.status : undefined,
      });

      if (res.success) {
        setSeller(res.data);
        setIsEditing(false);
        setSuccessMessage("Seller profile updated successfully in PostgreSQL!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save seller changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusQuickChange = async (newStatus: string) => {
    if (!seller || !userCanChangeStatus) return;
    setSaving(true);
    try {
      const res = await sellersApi.update(seller.id, { status: newStatus });
      if (res.success) {
        setSeller(res.data);
        setForm((prev) => ({ ...prev, status: newStatus }));
        setSuccessMessage(`Status updated to ${newStatus} in database.`);
        setTimeout(() => setSuccessMessage(null), 2500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update seller status.");
    } finally {
      setSaving(false);
    }
  };

  const statusStyle = (s: string) => {
    switch (s?.toLowerCase()) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "suspended":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const statusDot = (s: string) => {
    switch (s?.toLowerCase()) {
      case "active":
        return "bg-emerald-500";
      case "pending":
        return "bg-amber-500";
      case "suspended":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center space-y-4">
        <RefreshCw size={36} className="animate-spin text-[#7699F0] mx-auto" />
        <p className="text-gray-500 text-sm">Loading seller data from PostgreSQL...</p>
      </div>
    );
  }

  if (error && !seller) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Seller Not Found</h2>
        <p className="text-sm text-gray-500">{error}</p>
        <Link
          href="/admin/sellers"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
        >
          <ArrowLeft size={16} />
          Back to Sellers List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* ── Alerts ─────────────────────────────────────────────────────── */}
      {successMessage && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="p-1 hover:bg-black/5 rounded-lg">
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm animate-fade-in">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-black/5 rounded-lg">
            <X size={15} />
          </button>
        </div>
      )}

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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? "Edit Seller Profile" : seller?.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live PostgreSQL
              </span>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-[#7699F0] rounded-lg">
                  <Shield size={11} />
                  Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-lg">
                  <Lock size={11} />
                  View &amp; Edit
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Database Record ID: #{seller?.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Seller portal link */}
          <a
            href="/seller"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            title="Open seller portal"
          >
            <ExternalLink size={14} />
            Seller Portal
          </a>

          {!isEditing ? (
            userCanEdit ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                <Edit3 size={16} />
                Edit Profile
              </button>
            ) : (
              <div
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed"
                title="You don't have permission to edit"
              >
                <Lock size={14} />
                Edit Profile
              </div>
            )
          ) : (
            <>
              <button
                onClick={() => {
                  if (seller) {
                    setForm({
                      name: seller.name,
                      owner_name: seller.owner_name,
                      email: seller.email,
                      phone: seller.phone || "",
                      address: seller.address || "",
                      description: seller.description || "",
                      logo: seller.logo || "",
                      status: seller.status,
                    });
                  }
                  setIsEditing(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                <X size={15} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#7699F0] rounded-xl hover:bg-blue-600 transition shadow-sm disabled:opacity-50"
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Profile banner card ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-[#7699F0] to-blue-500" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {seller?.logo ? (
              <img
                src={seller.logo}
                alt={seller.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gray-100 border-4 border-white shadow-md flex items-center justify-center">
                <Store size={32} className="text-gray-400" />
              </div>
            )}
            <div className="pb-1 flex-1">
              <h2 className="text-xl font-bold text-gray-900">{seller?.name}</h2>
              <p className="text-sm text-gray-500">Owner: {seller?.owner_name}</p>
            </div>
            {seller && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusStyle(
                  seller.status
                )}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot(seller.status)}`} />
                {seller.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Products",
            value: seller?.products_count ?? 0,
            icon: Package,
            color: "text-[#7699F0] bg-blue-50",
          },
          {
            label: "Orders",
            value: seller?.orders_count ?? 0,
            icon: ShoppingCart,
            color: "text-orange-600 bg-orange-50",
          },
          {
            label: "Rating",
            value: Number(seller?.rating ?? 5.0).toFixed(1),
            icon: Star,
            color: "text-amber-600 bg-amber-50",
          },
          {
            label: "Revenue",
            value: `$${Number(seller?.total_revenue ?? 0).toLocaleString()}`,
            icon: TrendingUp,
            color: "text-emerald-600 bg-emerald-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color}`}
              >
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Seller Info / Edit form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">
              {isEditing ? "Edit Information" : "Seller Information"}
            </h2>
            {!isEditing && userCanEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-[#7699F0] hover:bg-blue-50 transition"
                title="Edit"
              >
                <Edit3 size={15} />
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <Field label="Store Name">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
                />
              </Field>
              <Field label="Owner Name">
                <input
                  name="owner_name"
                  value={form.owner_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
                />
              </Field>
              <Field label="Phone">
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
                />
              </Field>
              <Field label="Address">
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
                />
              </Field>
              <Field label="Logo URL">
                <input
                  name="logo"
                  value={form.logo}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
                />
              </Field>

              {/* Status — admin only */}
              <Field label="Status">
                {userCanChangeStatus ? (
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle(
                        form.status
                      )}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusDot(form.status)}`}
                      />
                      {form.status}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Lock size={11} />
                      Admin only
                    </span>
                  </div>
                )}
              </Field>

              <Field label="Description">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition resize-none"
                />
              </Field>
            </div>
          ) : (
            <div className="space-y-4">
              <InfoRow icon={<Mail size={15} />} label="Email" value={seller?.email ?? "—"} />
              <InfoRow icon={<Phone size={15} />} label="Phone" value={seller?.phone ?? "—"} />
              <InfoRow icon={<MapPin size={15} />} label="Address" value={seller?.address ?? "—"} />
              <InfoRow icon={<Calendar size={15} />} label="Joined" value={formatDate(seller?.created_at)} />
              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {seller?.description || "No description provided."}
                </p>
              </div>

              {/* Admin-only: Status change buttons */}
              {isAdmin && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <Shield size={11} />
                    Quick Moderate Status (PostgreSQL)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Active", "Pending", "Suspended"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusQuickChange(s)}
                        disabled={saving || seller?.status === s}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                          seller?.status === s
                            ? statusStyle(s)
                            : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                        } disabled:opacity-80`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Products */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Catalog Preview</h2>
            <Link
              href="/admin/products"
              className="text-sm text-[#7699F0] hover:underline"
            >
              View all products
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No products found in catalog.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 transition"
                >
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-9 h-9 rounded-lg object-cover border border-gray-100"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <Package size={16} />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Stock: {product.stock} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${Number(product.price).toFixed(2)}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        product.stock > 10
                          ? "text-emerald-600"
                          : product.stock > 0
                          ? "text-amber-600"
                          : "text-red-500"
                      }`}
                    >
                      {product.stock > 10
                        ? "In stock"
                        : product.stock > 0
                        ? "Low stock"
                        : "Out of stock"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Permission note for non-admins ──────────────────────────────── */}
      {!isAdmin && (
        <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-600">
          <Lock size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
          <div>
            <p className="font-semibold text-gray-700">Limited Access</p>
            <p className="text-gray-500 mt-0.5">
              You can view and edit this seller&apos;s profile information.
              Changing seller <strong>status</strong> (Active / Suspended) or{" "}
              <strong>creating new sellers</strong> requires Admin or Super Admin
              role.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
      </div>
    </div>
  );
}