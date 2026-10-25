"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import AdminSidebar from "./AdminSidebar";

type Role = "admin" | "seller";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: Role;
  title?: string;
}

export default function DashboardLayout({
  children,
  role = "admin",
  title = "Dashboard",
}: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const SidebarComponent = AdminSidebar;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ========== Desktop Sidebar ========== */}
      <div className="hidden lg:flex">
        <SidebarComponent isCollapsed={isCollapsed} />
      </div>

      {/* ========== Mobile Overlay ========== */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ========== Mobile Sidebar ========== */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarComponent />
      </div>

      {/* ========== Main Content Area ========== */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Only 1 Navbar */}
        <Navbar
          title={title}
          onMenuClick={() => setIsMobileOpen(true)}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isCollapsed={isCollapsed}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}