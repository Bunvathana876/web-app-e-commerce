"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  Edit3,
  Mail,
  Phone,
  Calendar,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { usersApi, ApiUser } from "@/lib/api";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const employeeId = Number(id);

  const [employee, setEmployee] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "employee",
    is_active: true,
  });

  const loadEmployee = useCallback(async () => {
    if (isNaN(employeeId)) {
      setNotification({ type: "error", text: "Invalid Employee ID format." });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await usersApi.get(employeeId);
      if (res.success && res.data) {
        const u = res.data;
        setEmployee(u);
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          role: u.role || "employee",
          is_active: u.is_active ?? true,
        });
      } else {
        setNotification({
          type: "error",
          text: res.message || "Team member not found.",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to load team member from PostgreSQL.",
      });
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

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
      const res = await usersApi.update(employeeId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        is_active: form.is_active,
      });

      if (res.success && res.data) {
        setEmployee(res.data);
        setIsEditing(false);
        setNotification({
          type: "success",
          text: "Team member updated successfully in PostgreSQL database!",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to update employee in database.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await usersApi.delete(employeeId);
      if (res.success) {
        router.push("/admin/employees");
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to delete team member.",
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
          Loading team member details from PostgreSQL...
        </p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Employee Not Found</h2>
        <p className="text-sm text-gray-500">
          User #{id} was not found in PostgreSQL database.
        </p>
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7699F0] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition"
        >
          <ArrowLeft size={16} /> Back to Employees
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/employees"
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Team Member" : employee.name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">PostgreSQL Staff #{employee.id}</p>
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
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition"
              >
                <Trash2 size={16} /> Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setForm({
                    name: employee.name || "",
                    email: employee.email || "",
                    phone: employee.phone || "",
                    role: employee.role || "employee",
                    is_active: employee.is_active ?? true,
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

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-[#7699F0] flex items-center justify-center font-bold text-xl border-2 border-white shadow-sm">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{employee.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 uppercase">
                {employee.role}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  employee.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    employee.is_active ? "bg-emerald-500" : "bg-gray-400"
                  }`}
                />
                {employee.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details or Edit Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-gray-900">Member Information</h2>

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
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              >
                <option value="seller">Seller / Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                name="is_active"
                value={form.is_active ? "true" : "false"}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              >
                <option value="true">Active (Access Enabled)</option>
                <option value="false">Inactive (Disabled)</option>
              </select>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Email Address</p>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Mail size={15} className="text-[#7699F0]" />
                {employee.email}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Phone size={15} className="text-emerald-500" />
                {employee.phone || "Not provided"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-400">Role in Store</p>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Shield size={15} className="text-violet-500" />
                {employee.role.toUpperCase()}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-400">Joined Date</p>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Calendar size={15} className="text-purple-500" />
                {new Date(employee.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Remove Team Member</h3>
                <p className="text-xs text-gray-500">This action is permanent.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to permanently remove{" "}
              <span className="font-semibold text-gray-900">{employee.name}</span> (ID: #{employee.id}) from PostgreSQL?
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
                {deleting ? "Deleting..." : "Confirm Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}