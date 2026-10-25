"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Users,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react";
import { usersApi, ApiUser } from "@/lib/api";

const initialRoleTemplates = [
  {
    id: "admin",
    name: "Admin",
    description: "Full system access to manage products, categories, orders, analytics, inventory, and users",
    permissionsCount: 24,
    color: "from-[#7699F0] to-blue-600",
    isSystem: true,
  },
  {
    id: "seller",
    name: "Seller",
    description: "Retail and merchant access for Point of Sale (POS), product catalog, orders, and sales reports",
    permissionsCount: 16,
    color: "from-emerald-500 to-teal-600",
    isSystem: false,
  },
];

export default function RolesPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error("Failed to load users for roles count:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const rolesWithLiveCounts = initialRoleTemplates.map((role) => {
    const count = users.filter(
      (u) =>
        u.role.toLowerCase() === role.id.toLowerCase() ||
        (role.id === "employee" && u.role.toLowerCase() === "staff")
    ).length;
    return {
      ...role,
      usersCount: count,
    };
  });

  const filtered = rolesWithLiveCounts.filter((role) =>
    role.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Access levels and user counts synchronized with PostgreSQL database
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search roles by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#7699F0]">
          <Loader2 size={32} className="animate-spin mb-2" />
          <p className="text-sm font-medium text-gray-500">
            Calculating role counts from PostgreSQL...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white shadow-sm`}
                >
                  <Shield size={24} />
                </div>
                {role.isSystem && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700">
                    System Protected
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-[#7699F0] transition">
                  {role.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {role.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1.5 font-medium text-gray-900">
                  <Users size={14} className="text-[#7699F0]" />
                  {role.usersCount} users in PostgreSQL
                </span>
                <span>{role.permissionsCount} permissions</span>
              </div>

              <Link
                href={`/admin/roles/${role.id}`}
                className="flex items-center justify-between w-full pt-2 text-sm font-semibold text-[#7699F0] hover:underline"
              >
                <span>View Assigned Users</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}