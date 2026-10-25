"use client";

import { useState } from "react";
import {
  Save,
  Store,
  Truck,
  CreditCard,
  Bell,
  Palette,
  Check,
  Upload,
  Plus,
  Database,
  ExternalLink,
} from "lucide-react";

type Tab =
  | "general"
  | "appearance"
  | "shipping"
  | "payment"
  | "notifications"
  | "database";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // General
  const [general, setGeneral] = useState({
    storeName: "My Awesome Store",
    storeEmail: "support@mystore.com",
    storePhone: "+855 12 345 678",
    storeAddress: "Street 271, Phnom Penh, Cambodia",
    currency: "USD",
    language: "en",
    timezone: "Asia/Phnom_Penh",
  });

  // Appearance
  const [appearance, setAppearance] = useState({
    theme: "light",
    primaryColor: "#7699F0",
    sidebarStyle: "default",
  });

  // Shipping
  const [shipping, setShipping] = useState({
    freeShippingMin: "50",
    standardFee: "5",
    expressFee: "12",
    estimatedDays: "3-5",
  });

  // Payment methods
  const [payments, setPayments] = useState([
    { id: "1", name: "ABA Bank", enabled: true },
    { id: "2", name: "Wing Money", enabled: true },
    { id: "3", name: "Cash on Delivery", enabled: true },
    { id: "4", name: "Credit Card", enabled: false },
  ]);

  // Notifications
  const [notifications, setNotifications] = useState({
    newOrder: true,
    lowStock: true,
    customerMessage: true,
    weeklyReport: false,
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      console.log("Settings saved");
    }, 800);
  };

  const togglePayment = (id: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const tabs = [
    { id: "general" as Tab, label: "General", icon: Store },
    { id: "appearance" as Tab, label: "Appearance", icon: Palette },
    { id: "shipping" as Tab, label: "Shipping", icon: Truck },
    { id: "payment" as Tab, label: "Payment", icon: CreditCard },
    { id: "notifications" as Tab, label: "Notifications", icon: Bell },
    { id: "database" as Tab, label: "PostgreSQL & pgAdmin 4", icon: Database },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure your store preferences
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#7699F0] rounded-xl hover:bg-blue-600 transition shadow-sm disabled:opacity-70"
        >
          {saved ? (
            <>
              <Check size={16} />
              Saved
            </>
          ) : (
            <>
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Changes"}
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
              activeTab === tab.id
                ? "bg-[#7699F0] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== GENERAL ========== */}
      {activeTab === "general" && (
        <div className="space-y-6">
          {/* Logo */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Store Logo</h2>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7699F0] to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                {general.storeName.charAt(0)}
              </div>
              <div>
                <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#7699F0] bg-blue-50 rounded-xl hover:bg-blue-100 transition">
                  <Upload size={16} />
                  Upload Logo
                </button>
                <p className="text-xs text-gray-400 mt-1.5">
                  200×200px recommended · PNG or JPG
                </p>
              </div>
            </div>
          </div>

          {/* Store Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Store Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Store Name
              </label>
              <input
                type="text"
                value={general.storeName}
                onChange={(e) =>
                  setGeneral({ ...general, storeName: e.target.value })
                }
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={general.storeEmail}
                  onChange={(e) =>
                    setGeneral({ ...general, storeEmail: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={general.storePhone}
                  onChange={(e) =>
                    setGeneral({ ...general, storePhone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address
              </label>
              <input
                type="text"
                value={general.storeAddress}
                onChange={(e) =>
                  setGeneral({ ...general, storeAddress: e.target.value })
                }
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Currency
                </label>
                <select
                  value={general.currency}
                  onChange={(e) =>
                    setGeneral({ ...general, currency: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
                >
                  <option value="USD">USD ($)</option>
                  <option value="KHR">KHR (៛)</option>
                  <option value="THB">THB (฿)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Language
                </label>
                <select
                  value={general.language}
                  onChange={(e) =>
                    setGeneral({ ...general, language: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
                >
                  <option value="en">English</option>
                  <option value="km">Khmer</option>
                  <option value="th">Thai</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Timezone
                </label>
                <select
                  value={general.timezone}
                  onChange={(e) =>
                    setGeneral({ ...general, timezone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
                >
                  <option value="Asia/Phnom_Penh">Phnom Penh (GMT+7)</option>
                  <option value="Asia/Bangkok">Bangkok (GMT+7)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== APPEARANCE ========== */}
      {activeTab === "appearance" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="font-semibold text-gray-900">Appearance</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Customize how your admin panel looks
            </p>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "light", label: "Light", bg: "bg-white border-gray-200" },
                { id: "dark", label: "Dark", bg: "bg-gray-800 border-gray-700" },
                { id: "system", label: "System", bg: "bg-gradient-to-br from-white to-gray-800 border-gray-300" },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() =>
                    setAppearance({ ...appearance, theme: theme.id })
                  }
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    appearance.theme === theme.id
                      ? "border-[#7699F0] ring-2 ring-[#7699F0]/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`h-12 rounded-lg ${theme.bg} border mb-2`} />
                  <p className="text-sm font-medium text-gray-800">{theme.label}</p>
                  {appearance.theme === theme.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#7699F0] rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Primary Color
            </label>
            <div className="flex flex-wrap gap-3">
              {["#7699F0", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899"].map(
                (color) => (
                  <button
                    key={color}
                    onClick={() =>
                      setAppearance({ ...appearance, primaryColor: color })
                    }
                    className={`w-10 h-10 rounded-full transition-all ${
                      appearance.primaryColor === color
                        ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== SHIPPING ========== */}
      {activeTab === "shipping" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900">Shipping Settings</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Configure delivery options and fees
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Free Shipping Minimum ($)
              </label>
              <input
                type="number"
                value={shipping.freeShippingMin}
                onChange={(e) =>
                  setShipping({ ...shipping, freeShippingMin: e.target.value })
                }
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
              />
              <p className="text-xs text-gray-400 mt-1">
                Orders above this amount get free shipping
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Estimated Delivery (days)
              </label>
              <input
                type="text"
                value={shipping.estimatedDays}
                onChange={(e) =>
                  setShipping({ ...shipping, estimatedDays: e.target.value })
                }
                placeholder="3-5"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Standard Shipping Fee ($)
              </label>
              <input
                type="number"
                value={shipping.standardFee}
                onChange={(e) =>
                  setShipping({ ...shipping, standardFee: e.target.value })
                }
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Express Shipping Fee ($)
              </label>
              <input
                type="number"
                value={shipping.expressFee}
                onChange={(e) =>
                  setShipping({ ...shipping, expressFee: e.target.value })
                }
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========== PAYMENT ========== */}
      {activeTab === "payment" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Payment Methods</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Enable or disable payment options
              </p>
            </div>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#7699F0] bg-blue-50 rounded-lg hover:bg-blue-100 transition">
              <Plus size={15} />
              Add
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {payments.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                    <CreditCard size={18} className="text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {method.name}
                  </span>
                </div>

                <button
                  onClick={() => togglePayment(method.id)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    method.enabled ? "bg-[#7699F0]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      method.enabled ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== NOTIFICATIONS ========== */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Notification Preferences</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Choose what you want to be notified about
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {[
              {
                key: "newOrder" as const,
                title: "New Orders",
                desc: "Get notified when a customer places an order",
              },
              {
                key: "lowStock" as const,
                title: "Low Stock Alerts",
                desc: "Alert when product inventory is running low",
              },
              {
                key: "customerMessage" as const,
                title: "Customer Messages",
                desc: "Notify when customers send a message",
              },
              {
                key: "weeklyReport" as const,
                title: "Weekly Report",
                desc: "Receive a weekly summary of store performance",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      [item.key]: !notifications[item.key],
                    })
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifications[item.key] ? "bg-[#7699F0]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      notifications[item.key] ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== POSTGRESQL & PGADMIN 4 ========== */}
      {activeTab === "database" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#7699F0] flex items-center justify-center">
                <Database size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">PostgreSQL Database Infrastructure</h2>
                <p className="text-xs text-gray-500">
                  Real-time connectivity status with Docker containers and pgAdmin 4
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">PostgreSQL Database</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900">ecommerce-postgres</p>
                <p className="text-xs font-mono text-gray-500">Port: 5433 (host) / 5432 (container)</p>
                <p className="text-xs text-gray-400">Database: <code className="text-gray-700">ecommerce</code></p>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">pgAdmin 4 GUI Tool</span>
                  <a
                    href="http://localhost:5050"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#7699F0] hover:underline"
                  >
                    Open GUI <ExternalLink size={12} />
                  </a>
                </div>
                <p className="text-sm font-semibold text-gray-900">ecommerce-pgadmin</p>
                <p className="text-xs font-mono text-gray-500">Port: 5050</p>
                <p className="text-xs text-gray-400">URL: <code className="text-gray-700">http://localhost:5050</code></p>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">FastAPI Backend API</span>
                  <a
                    href="http://localhost:8000/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#7699F0] hover:underline"
                  >
                    Swagger Docs <ExternalLink size={12} />
                  </a>
                </div>
                <p className="text-sm font-semibold text-gray-900">ecommerce-backend</p>
                <p className="text-xs font-mono text-gray-500">Port: 8000</p>
                <p className="text-xs text-gray-400">Base: <code className="text-gray-700">http://localhost:8000/api</code></p>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Live Tables Sync</span>
                  <span className="text-xs font-semibold text-emerald-600">Active</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">10 Database Tables</p>
                <p className="text-xs text-gray-500">
                  users, sellers, products, categories, orders, order_items, reviews, cart, coupons, addresses
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}