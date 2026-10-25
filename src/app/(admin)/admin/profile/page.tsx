"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Camera,
  Mail,
  Phone,
  Shield,
  Save,
  Edit3,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { authApi, uploadApi, ApiUser } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default function ProfilePage() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        setForm({
          name: res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          avatar: res.data.avatar || "",
        });
      } else {
        // Fallback to local user
        const local = getCurrentUser();
        if (local) {
          setUser(local as any);
          setForm({
            name: local.name || "",
            email: local.email || "",
            phone: local.phone || "",
            avatar: local.avatar || "",
          });
        }
      }
    } catch {
      const local = getCurrentUser();
      if (local) {
        setUser(local as any);
        setForm({
          name: local.name || "",
          email: local.email || "",
          phone: local.phone || "",
          avatar: local.avatar || "",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      if (res.success && res.data?.url) {
        setForm((prev) => ({ ...prev, avatar: res.data.url }));
        setNotification({
          type: "success",
          text: "Avatar image uploaded to server.",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to upload image.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setNotification(null);
    try {
      const res = await authApi.updateMe({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        avatar: form.avatar.trim() || undefined,
      });

      if (res.success && res.data) {
        setUser(res.data);
        setIsEditing(false);
        setNotification({
          type: "success",
          text: "Profile updated successfully in PostgreSQL database!",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-[#7699F0]">
        <Loader2 size={36} className="animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">
          Loading profile from PostgreSQL...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administrator Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal profile in PostgreSQL
          </p>
        </div>

        <div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (user) {
                    setForm({
                      name: user.name || "",
                      email: user.email || "",
                      phone: user.phone || "",
                      avatar: user.avatar || "",
                    });
                  }
                  setIsEditing(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#7699F0] rounded-xl hover:bg-blue-600 disabled:opacity-50 transition shadow-sm"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#7699F0] rounded-xl hover:bg-blue-600 transition shadow-sm"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
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

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-100 text-[#7699F0] flex items-center justify-center font-bold text-2xl border-4 border-white shadow-md">
              {form.avatar || user?.avatar ? (
                <img
                  src={form.avatar || user?.avatar || ""}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "A"
              )}
            </div>

            {isEditing && (
              <>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-[#7699F0] text-white rounded-full shadow hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex px-3 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 uppercase">
                <Shield size={12} className="inline mr-1" />
                {user?.role || "Admin"}
              </span>
              <span className="inline-flex px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                PostgreSQL Connected
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Form or Info View */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-gray-900">Personal Information</h2>

        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                disabled
                className="w-full px-4 py-2.5 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
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
                Avatar Image URL
              </label>
              <input
                type="text"
                name="avatar"
                value={form.avatar}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Full Name</p>
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-400">Email Address</p>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Mail size={15} className="text-[#7699F0]" />
                {user?.email}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Phone size={15} className="text-emerald-500" />
                {user?.phone || "Not set"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-400">System Role</p>
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Shield size={15} className="text-violet-500" />
                {user?.role}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}