"use client";


import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isLoggedIn } from "@/lib/auth";

// export const metadata: Metadata = {
//   title: "Admin Dashboard",
//   description: "Admin panel for managing the platform",
// };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      if (!isLoggedIn()) {
        router.replace("/login");
      } else {
        setReady(true);
      }
    };

    checkAuth();

    window.addEventListener("auth-changed", checkAuth);
    return () => window.removeEventListener("auth-changed", checkAuth);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#7699F0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return (
    <DashboardLayout role="admin" title="Admin Dashboard">
      {children}
    </DashboardLayout>
  );
}
