"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoPersonSharp } from "react-icons/io5";
import { MdOutlineEmail } from "react-icons/md";
import { FaLock } from "react-icons/fa";
import { authApi } from "@/lib/api";
import { isLoggedIn, saveAuthSession, getCurrentUser } from "@/lib/auth";

type Mode = "login" | "register";

interface AuthFormProps {
  mode: Mode;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep state in sync when navigating between /login and /register
  useEffect(() => {
    setIsLogin(mode === "login");
    setErrorMessage(null);
  }, [mode]);

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await authApi.login({ email, password });
        saveAuthSession(res.data.access_token, res.data.user);
        router.push("/admin/dashboard");
      } else {
        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match.");
          setLoading(false);
          return;
        }
        const res = await authApi.register({ name, email, password });
        saveAuthSession(res.data.access_token, res.data.user);
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Navigate + animate
  const switchToRegister = () => {
    setIsLogin(false);
    setErrorMessage(null);
    router.push("/register");
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setErrorMessage(null);
    router.push("/login");
  };

  return (
    <div className="relative flex w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden min-h-137.5">
      {/* ========== REGISTER SIDE ========== */}
      <div
        className={`w-full md:w-1/2 p-10 flex flex-col justify-center items-center ${
          isLogin ? "hidden md:flex" : "flex"
        }`}
      >
        <h2 className="text-3xl font-bold mb-2 text-gray-800">Registration</h2>
        <p className="text-xs text-gray-400 mb-6">Create your store account</p>

        {errorMessage && !isLogin && (
          <div className="w-full max-w-xs mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
            {errorMessage}
          </div>
        )}

        <form className="w-full space-y-4 max-w-xs" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="relative">
            <input
              type="text"
              value={name}
              placeholder="Full Name"
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#F3F4F6] text-sm rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              required={!isLogin}
            />
            <span className="absolute right-3 top-3 text-gray-400">
              <IoPersonSharp size={18} />
            </span>
          </div>

          {/* Email */}
          <div className="relative">
            <input
              type="email"
              value={email}
              placeholder="email@example.com"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F3F4F6] text-sm rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              required
            />
            <span className="absolute right-3 top-3 text-gray-400">
              <MdOutlineEmail size={18} />
            </span>
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type="password"
              value={password}
              placeholder="Password (min 6 chars)"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F3F4F6] text-sm rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              required
            />
            <span className="absolute right-3 top-3 text-gray-400">
              <FaLock size={16} />
            </span>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type="password"
              value={confirmPassword}
              placeholder="Confirm Password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#F3F4F6] text-sm rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              required={!isLogin}
            />
            <span className="absolute right-3 top-3 text-gray-400">
              <FaLock size={16} />
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7699F0] text-white font-semibold rounded-xl py-3 mt-4 hover:bg-blue-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Register"
            )}
          </button>

          {/* Mobile toggle */}
          <p className="mt-4 text-center text-sm text-gray-600 md:hidden">
            Already have an account?{" "}
            <button
              type="button"
              onClick={switchToLogin}
              className="text-[#7699F0] font-bold hover:underline"
            >
              Login here
            </button>
          </p>
        </form>
      </div>

      {/* ========== LOGIN SIDE ========== */}
      <div
        className={`w-full md:w-1/2 p-10 flex flex-col justify-center items-center ${
          isLogin ? "flex" : "hidden md:flex"
        }`}
      >
        <h2 className="text-3xl font-bold mb-2 text-gray-800">Login</h2>
        <p className="text-xs text-gray-400 mb-6">Sign in to manage store</p>

        {errorMessage && isLogin && (
          <div className="w-full max-w-xs mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
            {errorMessage}
          </div>
        )}

        <form className="w-full space-y-4 max-w-xs" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full bg-[#F3F4F6] text-sm rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              required
            />
            <span className="absolute right-3 top-3 text-gray-400">
              <MdOutlineEmail size={18} />
            </span>
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#F3F4F6] text-sm rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#7699F0]"
              required
            />
            <span className="absolute right-3 top-3 text-gray-400">
              <FaLock size={16} />
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7699F0] text-white font-semibold rounded-xl py-3 mt-4 hover:bg-blue-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Login"
            )}
          </button>

          {/* Mobile toggle */}
          <p className="mt-4 text-center text-sm text-gray-600 md:hidden">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={switchToRegister}
              className="text-[#7699F0] font-bold hover:underline"
            >
              Register here
            </button>
          </p>
        </form>
      </div>

      {/* ========== SLIDING BLUE PANEL ========== */}
      <div
        className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full bg-[#7699F0] p-12 flex-col justify-center items-center text-white z-10
    transition-all duration-700 ease-in-out
    ${isLogin ? "translate-x-0 rounded-r-[100px]" : "translate-x-full rounded-l-[100px]"}`}
      >
        {isLogin ? (
          <div className="flex flex-col items-center">
            <h2 className="text-4xl font-bold mb-4 tracking-wide text-center">
              Welcome Back!
            </h2>
            <p className="text-center text-sm text-blue-50 mb-8">
              Don&apos;t have an account yet?
            </p>
            <button
              type="button"
              onClick={switchToRegister}
              className="border border-white rounded-xl px-12 py-2.5 font-medium hover:bg-white hover:text-[#7699F0] transition-colors"
            >
              Register
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <h2 className="text-4xl font-bold mb-4 tracking-wide text-center">
              Hello, Welcome!
            </h2>
            <p className="text-center text-sm text-blue-50 mb-8">
              Already have an account?
            </p>
            <button
              type="button"
              onClick={switchToLogin}
              className="border border-white rounded-xl px-12 py-2.5 font-medium hover:bg-white hover:text-[#7699F0] transition-colors"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
