"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getCurrentUser } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-[#7699F0] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}