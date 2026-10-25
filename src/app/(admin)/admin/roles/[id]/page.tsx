"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Check,
  Users,
  Loader2,
  Mail,
} from "lucide-react";
import { usersApi, ApiUser } from "@/lib/api";

const permissionGroups = [
  {
    name: "Dashboard",
    permissions: [
      { id: "dashboard.view", label: "View Dashboard" },
      { id: "dashboard.analytics", label: "View Analytics" },
    ],
  },
  {
    name: "Products",
    permissions: [
      { id: "products.view", label: "View Products" },
      { id: "products.create", label: "Create Products" },
      { id: "products.edit", label: "Edit Products" },
      { id: "products.delete", label: "Delete Products" },
    ],
  },
  {
    name: "Orders",
    permissions: [
      { id: "orders.view", label: "View Orders" },
      { id: "orders.update", label: "Update Order Status" },
      { id: "orders.delete", label: "Cancel Orders" },
    ],
  },
  {
    name: "Categories",
    permissions: [
      { id: "categories.view", label: "View Categories" },
      { id: "categories.create", label: "Create Categories" },
      { id: "categories.edit", label: "Edit Categories" },
      { id: "categories.delete", label: "Delete Categories" },
    ],
  },
  {
    name: "Sellers & Suppliers",
    permissions: [
      { id: "sellers.view", label: "View Sellers" },
      { id: "sellers.create", label: "Create Sellers" },
      { id: "sellers.edit", label: "Edit Sellers" },
    ],
  },
];

export default function RoleDetailPage() {
  const params = useParams();
  const id = (params.id as string).toLowerCase();

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);

  const roleTitle =
    id === "admin"
      ? "Admin"
      : id === "seller"
      ? "Seller"
      : id.toUpperCase();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const res = await usersApi.list();
        if (res.success && res.data) {
          const assigned = res.data.filter(
            (u) =>
              u.role.toLowerCase() === id ||
              (id === "employee" && u.role.toLowerCase() === "staff") ||
              (id === "staff" && u.role.toLowerCase() === "employee")
          );
          setUsers(assigned);
        }
      } catch (err) {
        console.error("Failed to load users for role:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/roles"
          className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{roleTitle} Role</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length} user(s) assigned in PostgreSQL database
          </p>
        </div>
      </div>

      {/* Role Overview Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#7699F0] flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{roleTitle}</h2>
            <p className="text-xs text-gray-400">PostgreSQL Role Identifier: {id}</p>
          </div>
        </div>
      </div>

      {/* Users assigned to this role in PostgreSQL */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users size={18} className="text-[#7699F0]" />
            Assigned Users in PostgreSQL ({users.length})
          </h2>
          <Link
            href="/admin/customers"
            className="text-xs font-semibold text-[#7699F0] hover:underline"
          >
            Manage User Roles →
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#7699F0]">
            <Loader2 size={24} className="animate-spin mb-2" />
            <p className="text-xs text-gray-500">Querying users from database...</p>
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            No users currently assigned to the &quot;{roleTitle}&quot; role.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-[#7699F0] flex items-center justify-center font-bold text-xs">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Mail size={11} /> {u.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {u.is_active ? "Active" : "Disabled"}
                  </span>
                  <Link
                    href={`/admin/customers/${u.id}`}
                    className="text-xs font-semibold text-[#7699F0] hover:underline"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permissions Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Configured Permissions</h2>
        <div className="space-y-4">
          {permissionGroups.map((group) => (
            <div key={group.name} className="border border-gray-100 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase mb-3">
                {group.name} Module
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.permissions.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-xs text-gray-700"
                  >
                    <Check size={14} className="text-emerald-600 flex-shrink-0" />
                    <span>{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}