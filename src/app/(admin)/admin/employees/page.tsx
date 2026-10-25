"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Trash2,
  Eye,
  Users,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { usersApi, ApiUser } from "@/lib/api";

const roleFilters = ["All", "admin", "seller"];
const statusFilters = ["All", "Active", "Inactive"];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list();
      if (res.success && res.data) {
        // Filter out pure customers to show team members / staff
        const staff = res.data.filter((u) => u.role !== "customer");
        setEmployees(staff.length > 0 ? staff : res.data);
      }
    } catch (err: any) {
      console.error("Failed to load employees:", err);
      setNotification({
        type: "error",
        text: err.message || "Failed to load team members from database.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to remove team member #${id}?`)) return;
    setDeletingId(id);
    try {
      const res = await usersApi.delete(id);
      if (res.success) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        setNotification({
          type: "success",
          text: `Employee #${id} removed successfully from database.`,
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to remove employee.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = employees.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());
    const matchRole =
      roleFilter === "All" || emp.role.toLowerCase() === roleFilter.toLowerCase();
    const matchStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" ? emp.is_active : !emp.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
      case "super_admin":
        return "bg-violet-50 text-violet-700";
      case "manager":
        return "bg-blue-50 text-blue-700";
      case "employee":
      case "staff":
        return "bg-emerald-50 text-emerald-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees & Staff</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your internal team members and administration roles in PostgreSQL
          </p>
        </div>
        <Link
          href="/admin/employees/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7699F0] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition shadow-sm"
        >
          <Plus size={18} />
          Add Employee
        </Link>
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#7699F0]">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Staff</p>
              <p className="text-xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-xl font-bold text-gray-900">
                {employees.filter((e) => e.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-xl font-bold text-gray-900">
                {employees.filter((e) => e.role === "admin" || e.role === "super_admin").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Managers/Staff</p>
              <p className="text-xl font-bold text-gray-900">
                {employees.filter((e) => e.role !== "admin" && e.role !== "super_admin").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search employee by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
            >
              {roleFilters.map((r) => (
                <option key={r} value={r}>
                  {r === "All" ? "All Roles" : r.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
            >
              {statusFilters.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Status" : s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#7699F0]">
            <Loader2 size={32} className="animate-spin mb-2" />
            <p className="text-sm font-medium text-gray-500">
              Loading employees from PostgreSQL...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users size={36} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No team members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Join Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-[#7699F0] flex items-center justify-center font-bold text-sm">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-400">ID: #{emp.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{emp.email}</p>
                      <p className="text-xs text-gray-400">{emp.phone || "No phone"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleColor(
                          emp.role
                        )}`}
                      >
                        {emp.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          emp.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            emp.is_active ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                        {emp.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/employees/${emp.id}`}
                          className="p-1.5 text-gray-400 hover:text-[#7699F0] hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          disabled={deletingId === emp.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          {deletingId === emp.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
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