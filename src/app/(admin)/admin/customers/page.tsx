"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Eye,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Shield,
  Loader2,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";
import { usersApi, ApiUser } from "@/lib/api";

const statusFilters = ["All", "Active", "Inactive"];
const roleFilters = ["All", "admin", "seller"];

export default function CustomersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  // Deletion state
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await usersApi.list();
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setActionMessage(null);

    try {
      const res = await usersApi.delete(userToDelete.id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        setActionMessage({
          type: "success",
          text: `User "${userToDelete.name}" was deleted successfully.`,
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err.message || "Failed to delete user. Please try again.",
      });
    } finally {
      setDeleting(false);
      setUserToDelete(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" ? u.is_active : !u.is_active);
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users & Customers</h1>
        <p className="text-sm text-gray-500 mt-1">
          {filtered.length} users found in PostgreSQL database
        </p>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm border ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
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
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-400 self-center mr-1">Status:</span>
            {statusFilters.map((status) => (
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

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-400 self-center mr-1">Role:</span>
            {roleFilters.map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                  roleFilter === role
                    ? "bg-[#7699F0] text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin text-[#7699F0] mb-2" size={32} />
            <p className="text-sm">Loading users from database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50/70">
                  <th className="font-medium px-6 py-4">User</th>
                  <th className="font-medium px-6 py-4">Contact</th>
                  <th className="font-medium px-6 py-4">Role</th>
                  <th className="font-medium px-6 py-4">Status</th>
                  <th className="font-medium px-6 py-4">Joined Date</th>
                  <th className="font-medium px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            user.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.name
                            )}&background=7699F0&color=fff`
                          }
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-100"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-400">ID: #{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Mail size={13} className="text-gray-400" />
                          <span className="text-xs">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Phone size={13} className="text-gray-400" />
                            <span className="text-xs">{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        <Shield size={12} />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.is_active ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/customers/${user.id}`}
                          className="p-2 rounded-lg text-gray-400 hover:text-[#7699F0] hover:bg-blue-50 transition"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Users className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-600 font-medium">No users found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try changing your search or filter criteria
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium">1–{filtered.length}</span> of{" "}
              <span className="font-medium">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to delete user{" "}
              <span className="font-semibold text-gray-900">
                &ldquo;{userToDelete.name}&rdquo;
              </span>{" "}
              (ID: #{userToDelete.id}, {userToDelete.email}) from PostgreSQL?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteUser}
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