"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  Edit,
  Store,
  ChevronLeft,
  ChevronRight,
  Mail,
  Package,
  Star,
  Plus,
  Shield,
  Lock,
  RefreshCw,
  Trash2,
  AlertTriangle,
  X,
  Phone,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { sellersApi, ApiSeller, ApiUser } from "@/lib/api";

const statusFilters = ["All", "Active", "Pending", "Suspended"];
const PAGE_SIZE = 6;

function canCreateSeller(user: ApiUser | null): boolean {
  if (!user) return false;
  return user.role === "super_admin" || user.role === "admin";
}

function canEditSeller(user: ApiUser | null): boolean {
  return !!user;
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<ApiSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);

  // Delete modal state
  const [sellerToDelete, setSellerToDelete] = useState<ApiSeller | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const loadSellers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await sellersApi.list();
      if (res.success && Array.isArray(res.data)) {
        setSellers(res.data);
      }
    } catch (err) {
      console.error("Failed to load sellers from database:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSellers();
  }, [loadSellers]);

  const handleDeleteSeller = async () => {
    if (!sellerToDelete) return;
    setDeleting(true);
    setActionMessage(null);
    try {
      const res = await sellersApi.delete(sellerToDelete.id);
      if (res.success) {
        setSellers((prev) => prev.filter((s) => s.id !== sellerToDelete.id));
        setActionMessage({
          type: "success",
          text: `Store "${sellerToDelete.name}" was deleted from PostgreSQL.`,
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err.message || "Failed to delete seller from database.",
      });
    } finally {
      setDeleting(false);
      setSellerToDelete(null);
    }
  };

  const filtered = sellers.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "All" ||
      s.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
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

  const getStatusDot = (status: string) => {
    switch (status.toLowerCase()) {
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isAdmin = canCreateSeller(currentUser);
  const canEdit = canEditSeller(currentUser);

  return (
    <div className="space-y-6">
      {/* ── Action Notification Banner ─────────────────────────────────── */}
      {actionMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-sm animate-fade-in ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Sellers</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              PostgreSQL Live
            </span>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-[#7699F0] rounded-lg">
                <Shield size={12} />
                Admin Access
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-lg">
                <Lock size={12} />
                View & Edit Only
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? "Loading sellers from database..." : `${filtered.length} seller${filtered.length !== 1 ? "s" : ""} found in pgAdmin4`}
            {!isAdmin && (
              <span className="ml-2 text-gray-400">
                · Only Admins can create new sellers
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSellers(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition shadow-sm"
            title="Refresh database records"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin text-[#7699F0]" : ""} />
          </button>

          {isAdmin ? (
            <Link
              href="/admin/sellers/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#7699F0] rounded-xl hover:bg-blue-600 transition shadow-sm"
            >
              <Plus size={16} />
              Add Seller
            </Link>
          ) : (
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed select-none"
              title="Only Super Admin or Admin can create sellers"
            >
              <Lock size={15} />
              Add Seller
            </div>
          )}
        </div>
      </div>

      {/* ── Search + Filters ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by store name, owner, or email in database..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
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

      {/* ── Sellers Table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="animate-spin text-[#7699F0] mx-auto" size={32} />
            <p className="text-gray-500 text-sm">Querying sellers from PostgreSQL...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50/70 border-b border-gray-100">
                  <th className="font-medium px-6 py-4">Store</th>
                  <th className="font-medium px-6 py-4">Owner</th>
                  <th className="font-medium px-6 py-4">Products</th>
                  <th className="font-medium px-6 py-4">Orders</th>
                  <th className="font-medium px-6 py-4">Rating</th>
                  <th className="font-medium px-6 py-4">Status</th>
                  <th className="font-medium px-6 py-4">Joined</th>
                  <th className="font-medium px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((seller) => (
                  <tr
                    key={seller.id}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {seller.logo ? (
                          <img
                            src={seller.logo}
                            alt={seller.name}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-100"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#7699F0] flex items-center justify-center font-bold">
                            <Store size={18} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {seller.name}
                          </p>
                          <p className="text-xs text-gray-400">ID: #{seller.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">
                          {seller.owner_name}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Mail size={11} />
                          {seller.email}
                        </p>
                        {seller.phone && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone size={11} />
                            {seller.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Package size={14} className="text-gray-400" />
                        <span className="font-medium">{seller.products_count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {seller.orders_count}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star
                          size={14}
                          className="text-amber-400 fill-amber-400"
                        />
                        <span className="font-medium text-gray-800">
                          {Number(seller.rating).toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(
                          seller.status
                        )}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${getStatusDot(
                            seller.status
                          )}`}
                        />
                        {seller.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {formatDate(seller.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Profile */}
                        <Link
                          href={`/admin/sellers/${seller.id}`}
                          className="p-2 rounded-lg text-gray-400 hover:text-[#7699F0] hover:bg-blue-50 transition"
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </Link>

                        {/* Edit Profile */}
                        {canEdit && (
                          <Link
                            href={`/admin/sellers/${seller.id}?edit=1`}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Profile"
                          >
                            <Edit size={16} />
                          </Link>
                        )}

                        {/* Delete — Admin only */}
                        {isAdmin && (
                          <button
                            onClick={() => setSellerToDelete(seller)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Seller"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && paginated.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Store className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-600 font-medium">No sellers found</p>
            <p className="text-sm text-gray-400 mt-1">
              {search || statusFilter !== "All"
                ? "Try adjusting your search query or filter"
                : "No sellers in database yet. Click '+ Add Seller' to create one."}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium">
                {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
                {Math.min(page * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of <span className="font-medium">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600 px-1">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      {sellerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Seller</h3>
                <p className="text-xs text-gray-500">This action will remove the record from PostgreSQL.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to delete store{" "}
              <strong className="text-gray-900">{sellerToDelete.name}</strong> (Owner: {sellerToDelete.owner_name})? This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSellerToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSeller}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Permission note ──────────────────────────────────────────────── */}
      {!isAdmin && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-800">
          <Lock size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">Restricted: Create Seller</p>
            <p className="text-amber-700 mt-0.5">
              Only <strong>Super Admin</strong> or <strong>Admin</strong> roles
              can register new sellers. You can view and edit existing seller
              profiles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}