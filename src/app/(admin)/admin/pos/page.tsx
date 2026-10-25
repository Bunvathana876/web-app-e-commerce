"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  ScanLine,
  Plus,
  Minus,
  Trash2,
  User,
  DollarSign,
  CreditCard,
  QrCode,
  Printer,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  Receipt,
  X,
  Package,
  Sparkles,
  Layers,
  Percent,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  Warehouse,
} from "lucide-react";
import {
  productsApi,
  categoriesApi,
  posApi,
  type ApiProduct,
  type ApiCategory,
  type PosReceipt,
  type PosSummary,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

// Lightweight, crisp SVG Barcode component for 80mm & 58mm thermal receipts
function SvgBarcode({ value }: { value: string }) {
  const bars: { width: number; isBlack: boolean }[] = [];
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 2, isBlack: false });

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const b1 = (code % 3) + 1;
    const s1 = ((code >> 2) % 2) + 1;
    const b2 = ((code >> 4) % 3) + 1;
    const s2 = (code % 2) + 1;
    bars.push({ width: b1, isBlack: true });
    bars.push({ width: s1, isBlack: false });
    bars.push({ width: b2, isBlack: true });
    bars.push({ width: s2, isBlack: false });
  }

  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 2, isBlack: true });

  const totalWidth = bars.reduce((acc, b) => acc + b.width, 0);

  let currentX = 0;
  return (
    <div className="flex flex-col items-center my-1">
      <svg
        viewBox={`0 0 ${totalWidth} 34`}
        className="w-44 h-8"
        preserveAspectRatio="none"
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width;
          if (!bar.isBlack) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={bar.width}
              height={34}
              fill="#000000"
            />
          );
        })}
      </svg>
      <span className="font-mono text-[9px] tracking-widest text-slate-700 mt-0.5">
        *{value}*
      </span>
    </div>
  );
}

interface PosCartItem {
  product: ApiProduct;
  quantity: number;
  unitPrice: number;
}

interface ParkedCart {
  id: string;
  timestamp: string;
  customerName: string;
  items: PosCartItem[];
  discountAmount: number;
  taxRate: number;
}

export default function PosPage() {
  // State: Data from API
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashierName, setCashierName] = useState("Cashier");

  // State: Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");

  // State: Active Cart
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountDollar, setDiscountDollar] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0); // 0%, 5%, 10%
  const [orderNotes, setOrderNotes] = useState("");

  // State: Customer Lookup Modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // State: Parked / Held Carts
  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>([]);
  const [showParkedModal, setShowParkedModal] = useState(false);

  // State: Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Credit Card" | "QR Pay">("Cash");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // State: Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<PosReceipt | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // State: Daily Register Summary Modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [dailySummary, setDailySummary] = useState<PosSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // State: Stock filter (all, low_stock <= 5, out_of_stock = 0)
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "low_stock" | "out_of_stock">("all");

  // State: Thermal receipt paper format (80mm standard POS vs 58mm compact)
  const [paperSize, setPaperSize] = useState<"80mm" | "58mm">("80mm");
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // State: Quick Restock Modal
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockProduct, setRestockProduct] = useState<ApiProduct | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [isRestocking, setIsRestocking] = useState(false);

  // State: POS Toast Feedback
  const [posToast, setPosToast] = useState<{ message: string; type: "success" | "warning" | "info" } | null>(null);

  // State: Cash Drawer Shift Reconciliation (Z-Report)
  const [openingFloat, setOpeningFloat] = useState<number>(100);
  const [actualCashCount, setActualCashCount] = useState<string>("");
  const [shiftReportView, setShiftReportView] = useState(false);

  // State: Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "success" | "warning" | "info" = "success") => {
    setPosToast({ message, type });
    setTimeout(() => {
      setPosToast(null);
    }, 3000);
  };

  // Inventory Quick Stats
  const stockStats = useMemo(() => {
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const outOfStock = products.filter((p) => p.stock <= 0).length;
    return { lowStock, outOfStock };
  }, [products]);

  // 1. Initial Load
  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsApi.list({ limit: 100 }),
        categoriesApi.list(),
      ]);
      if (prodRes?.data?.items) {
        setProducts(prodRes.data.items);
      } else if (Array.isArray(prodRes?.data)) {
        setProducts(prodRes.data as ApiProduct[]);
      }
      if (catRes?.data) setCategories(catRes.data);
    } catch (err) {
      console.error("Failed to load POS data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const user = getCurrentUser();
    if (user?.name) setCashierName(user.name);

    // Restore parked carts from session/local storage
    try {
      const savedParked = localStorage.getItem("pos_parked_carts");
      if (savedParked) setParkedCarts(JSON.parse(savedParked));
    } catch {}
  }, []);

  // Save parked carts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("pos_parked_carts", JSON.stringify(parkedCarts));
    } catch {}
  }, [parkedCarts]);

  // Keyboard shortcut: Press / or F2 to focus search, Esc to close modals, F4 to park, F8 for summary, F9 for checkout
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "/" || e.key === "F2") && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        parkCurrentCart();
      } else if (e.key === "F8") {
        e.preventDefault();
        openSummaryModal();
      } else if (e.key === "F9" && cart.length > 0 && !showPaymentModal && !showReceiptModal) {
        e.preventDefault();
        initiateCheckout();
      } else if (e.key === "Escape") {
        setShowPaymentModal(false);
        setShowCustomerModal(false);
        setShowParkedModal(false);
        setShowSummaryModal(false);
        setShowReceiptModal(false);
        setShowRestockModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.length, showPaymentModal, showReceiptModal]);

  // Filtered Products with Stock Filter
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "all" || p.category_id === selectedCategory;
      const sku = `sku-${p.id.toString().padStart(4, "0")}`;
      const matchesSearch =
        searchQuery.trim() === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.id) === searchQuery.trim() ||
        sku.toLowerCase().includes(searchQuery.toLowerCase().trim());

      let matchesStock = true;
      if (stockStatusFilter === "low_stock") {
        matchesStock = p.stock > 0 && p.stock <= 5;
      } else if (stockStatusFilter === "out_of_stock") {
        matchesStock = p.stock <= 0;
      }

      return matchesCategory && matchesSearch && matchesStock;
    });
  }, [products, selectedCategory, searchQuery, stockStatusFilter]);

  // Barcode / Scanner Enter-key auto-add
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = searchQuery.trim().toLowerCase();
      if (!trimmed) return;

      // Exact match check (by ID, SKU or exact name)
      const exactMatch = products.find(
        (p) =>
          String(p.id) === trimmed ||
          `sku-${p.id.toString().padStart(4, "0")}`.toLowerCase() === trimmed ||
          p.name.toLowerCase() === trimmed
      );

      const target = exactMatch || (filteredProducts.length === 1 ? filteredProducts[0] : null);

      if (target) {
        if (target.stock <= 0) {
          showToast(`'${target.name}' is Out of Stock!`, "warning");
        } else {
          addToCart(target);
          setSearchQuery("");
          showToast(`Added '${target.name}' to cart`, "success");
        }
      } else if (filteredProducts.length > 1) {
        showToast(`${filteredProducts.length} items found. Please pick an item or scan specific barcode.`, "info");
      } else {
        showToast(`No item found for barcode '${searchQuery}'`, "warning");
      }
    }
  };

  // Quick Restock from POS
  const handleQuickRestock = async () => {
    if (!restockProduct) return;
    setIsRestocking(true);
    try {
      const newStock = restockProduct.stock + Number(restockQty);
      await productsApi.update(restockProduct.id, { stock: newStock });
      setProducts((prev) =>
        prev.map((p) => (p.id === restockProduct.id ? { ...p, stock: newStock } : p))
      );
      showToast(`Restocked '${restockProduct.name}' to ${newStock} units`, "success");
      setShowRestockModal(false);
      setRestockProduct(null);
    } catch (err: any) {
      alert("Failed to update stock: " + (err.message || "Unknown error"));
    } finally {
      setIsRestocking(false);
    }
  };

  // Add Product to Cart
  const addToCart = (product: ApiProduct) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      const discountPriceNum = Number(product.discount_price);
      const effectivePrice =
        discountPriceNum > 0 ? discountPriceNum : Number(product.price) || 0;

      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Cannot add more than ${product.stock} units (current stock limit).`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1, unitPrice: effectivePrice }];
      }
    });
  };

  // Adjust Quantity
  const updateQuantity = (productId: number, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              alert(`Maximum available stock is ${item.product.stock}.`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as PosCartItem[];
    });
  };

  // Remove Item
  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Clear Cart
  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm("Are you sure you want to clear the active register cart?")) {
      setCart([]);
      setDiscountPercent(0);
      setDiscountDollar(0);
      setCustomerName("Walk-in Customer");
      setCustomerPhone("");
      setSelectedCustomerId(null);
      setOrderNotes("");
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountPercent > 0) {
      return (subtotal * discountPercent) / 100;
    }
    return Math.min(subtotal, discountDollar);
  }, [subtotal, discountPercent, discountDollar]);

  const taxAmount = useMemo(() => {
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    return (afterDiscount * taxRate) / 100;
  }, [subtotal, discountAmount, taxRate]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount);
  }, [subtotal, discountAmount, taxAmount]);

  // Hold / Park Cart
  const parkCurrentCart = () => {
    if (cart.length === 0) return;
    const newParked: ParkedCart = {
      id: "PARK-" + Date.now().toString().slice(-4),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      customerName: customerName || "Walk-in Customer",
      items: [...cart],
      discountAmount,
      taxRate,
    };
    setParkedCarts((prev) => [newParked, ...prev]);
    setCart([]);
    setDiscountPercent(0);
    setDiscountDollar(0);
    setCustomerName("Walk-in Customer");
    setCustomerPhone("");
    setSelectedCustomerId(null);
  };

  // Resume Parked Cart
  const resumeParkedCart = (parked: ParkedCart) => {
    if (cart.length > 0) {
      if (!window.confirm("Resume this cart? Current active cart will be overwritten.")) {
        return;
      }
    }
    setCart(parked.items);
    setCustomerName(parked.customerName);
    setDiscountDollar(parked.discountAmount);
    setTaxRate(parked.taxRate);
    setParkedCarts((prev) => prev.filter((p) => p.id !== parked.id));
    setShowParkedModal(false);
  };

  // Open Checkout Modal
  const initiateCheckout = () => {
    if (cart.length === 0) return;
    setCashTendered(grandTotal.toFixed(2));
    setPaymentMethod("Cash");
    setShowPaymentModal(true);
  };

  // Customer Search
  const handleCustomerSearch = async (query: string) => {
    setCustomerSearch(query);
    if (!query.trim()) {
      setCustomerResults([]);
      return;
    }
    setSearchingCustomers(true);
    try {
      const res = await posApi.searchCustomers(query);
      if (res?.data) setCustomerResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingCustomers(false);
    }
  };

  const selectCustomer = (c: any) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone || "");
    setSelectedCustomerId(c.id);
    setShowCustomerModal(false);
  };

  // Complete Payment & Submit
  const handleCompletePayment = async () => {
    const tendered = parseFloat(cashTendered) || grandTotal;
    if (paymentMethod === "Cash" && tendered < grandTotal) {
      alert("Tendered cash is less than total amount due.");
      return;
    }

    setProcessingPayment(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        customer_id: selectedCustomerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_method: paymentMethod,
        amount_paid: tendered,
        change_due: Math.max(0, tendered - grandTotal),
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        notes: orderNotes,
      };

      const res = await posApi.checkout(payload);
      if (res?.data) {
        setActiveReceipt(res.data);
        setShowPaymentModal(false);
        setShowReceiptModal(true);

        // Reset cart for next customer
        setCart([]);
        setDiscountPercent(0);
        setDiscountDollar(0);
        setCustomerName("Walk-in Customer");
        setCustomerPhone("");
        setSelectedCustomerId(null);
        setOrderNotes("");

        // Refresh products to reflect new stock
        loadData();
      }
    } catch (err: any) {
      alert("Payment failed: " + (err.message || "Unknown error"));
    } finally {
      setProcessingPayment(false);
    }
  };

  // Load Daily Summary
  const openSummaryModal = async () => {
    setShowSummaryModal(true);
    setLoadingSummary(true);
    try {
      const res = await posApi.getSummary();
      if (res?.data) setDailySummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Copy Plain Text Receipt for Telegram / WhatsApp
  const copyReceiptToClipboard = () => {
    if (!activeReceipt) return;
    const lines = [
      "================================",
      "       BLUE PANDA STORE         ",
      "    Retail Point of Sale (POS)  ",
      "================================",
      `Receipt #: ${activeReceipt.order_number}`,
      `Date: ${new Date(activeReceipt.created_at).toLocaleString()}`,
      `Cashier: ${activeReceipt.cashier_name}`,
      `Customer: ${activeReceipt.customer_name}`,
      "--------------------------------",
      ...activeReceipt.items.map(
        (it) =>
          `${it.product_name.slice(0, 18).padEnd(18)} x${it.quantity}  $${Number(it.subtotal).toFixed(2)}`
      ),
      "--------------------------------",
      `Subtotal:       $${Number(activeReceipt.subtotal).toFixed(2)}`,
      Number(activeReceipt.discount_amount) > 0
        ? `Discount:      -$${Number(activeReceipt.discount_amount).toFixed(2)}`
        : null,
      Number(activeReceipt.tax_amount) > 0
        ? `Tax:           +$${Number(activeReceipt.tax_amount).toFixed(2)}`
        : null,
      `TOTAL:          $${Number(activeReceipt.total).toFixed(2)}`,
      `Payment:        ${activeReceipt.payment_method}`,
      `Paid:           $${Number(activeReceipt.amount_paid).toFixed(2)}`,
      `Change:         $${Number(activeReceipt.change_due).toFixed(2)}`,
      "================================",
      "Thank you for shopping with us! ",
      "Tel: +855 23 999 888",
      "================================",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(lines).then(() => {
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2000);
      showToast("Receipt copied to clipboard for sharing", "success");
    });
  };

  // Print Receipt (handles 80mm & 58mm)
  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-100 overflow-hidden font-sans select-none relative">
      {/* Toast Notification Banner */}
      {posToast && (
        <div
          className={`fixed top-4 right-6 z-50 px-4 py-2.5 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top duration-200 ${
            posToast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : posToast.type === "warning"
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-indigo-50 text-indigo-800 border-indigo-200"
          }`}
        >
          {posToast.type === "success" && <CheckCircle2 size={16} className="text-emerald-600" />}
          {posToast.type === "warning" && <AlertTriangle size={16} className="text-amber-600" />}
          {posToast.type === "info" && <AlertCircle size={16} className="text-indigo-600" />}
          <span>{posToast.message}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP CASHIER STATUS BAR                                     */}
      {/* ============================================================== */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-slate-200 shadow-xs z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
              Register #01 • Online
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <User size={14} className="text-slate-400" />
            <span>Cashier:</span>
            <span className="font-semibold text-slate-800">{cashierName}</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 ml-2 text-[11px] text-slate-400">
            <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">/ or F2</span>
            <span>Search</span>
            <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono ml-1">F4</span>
            <span>Hold</span>
            <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono ml-1">F8</span>
            <span>Shift</span>
            <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono ml-1">F9</span>
            <span>Pay</span>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2">
          {/* Parked Carts Button */}
          <button
            onClick={() => setShowParkedModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors relative"
            title="Held Orders (F4)"
          >
            <PauseCircle size={15} className="text-amber-600" />
            <span>Parked</span>
            {parkedCarts.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                {parkedCarts.length}
              </span>
            )}
          </button>

          {/* Daily Register Summary / Shift Report */}
          <button
            onClick={openSummaryModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Daily Register & Shift Closeout (F8)"
          >
            <Receipt size={15} className="text-indigo-600" />
            <span>Shift & Summary</span>
          </button>

          {/* Refresh Catalog */}
          <button
            onClick={loadData}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh Products"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen POS Mode"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN CASHIER WORKBENCH (SPLIT VIEW)                         */}
      {/* ============================================================== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ========================================== */}
        {/* LEFT COLUMN: PRODUCT CATALOG & SEARCH      */}
        {/* ========================================== */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden border-r border-slate-200">
          {/* Search Bar + Barcode Icon */}
          <div className="flex items-center gap-3 mb-2.5">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Scan barcode, type SKU or product title and press Enter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-28 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-16 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                <ScanLine size={13} className="text-slate-500" />
                <span>Auto-Scan</span>
              </div>
            </div>
          </div>

          {/* Quick Stock & Category Filter Row */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
            {/* Inventory Status Pills */}
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl flex-shrink-0">
              <button
                onClick={() => setStockStatusFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  stockStatusFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({products.length})
              </button>
              <button
                onClick={() => setStockStatusFilter("low_stock")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  stockStatusFilter === "low_stock"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-amber-700 hover:bg-amber-100/50"
                }`}
              >
                <AlertTriangle size={12} />
                <span>Low Stock ({stockStats.lowStock})</span>
              </button>
              <button
                onClick={() => setStockStatusFilter("out_of_stock")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  stockStatusFilter === "out_of_stock"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-rose-700 hover:bg-rose-100/50"
                }`}
              >
                <span>Out of Stock ({stockStats.outOfStock})</span>
              </button>
            </div>

            <span className="text-slate-300">|</span>

            {/* Category Chips Bar */}
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id).length;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw size={32} className="animate-spin mb-2 text-indigo-500" />
                <span className="text-sm">Loading product catalog...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
                <Package size={40} className="text-slate-300 mb-2" />
                <span className="font-semibold text-slate-600 text-sm">No products found</span>
                <span className="text-xs text-slate-400 mt-1">
                  Try another keyword, barcode or reset stock filter
                </span>
                {stockStatusFilter !== "all" && (
                  <button
                    onClick={() => setStockStatusFilter("all")}
                    className="mt-3 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Reset Stock Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const discountPriceNum = Number(p.discount_price);
                  const effectivePrice =
                    discountPriceNum > 0 ? discountPriceNum : Number(p.price) || 0;
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= 5;
                  const inCartItem = cart.find((i) => i.product.id === p.id);

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (isOutOfStock) {
                          showToast(`Cannot add '${p.name}': Item is sold out!`, "warning");
                        } else {
                          addToCart(p);
                        }
                      }}
                      className={`group relative flex flex-col justify-between bg-white rounded-xl p-3 border transition-all cursor-pointer ${
                        isOutOfStock
                          ? "opacity-60 border-rose-200 bg-rose-50/20 hover:border-rose-300"
                          : inCartItem
                          ? "border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                          : isLowStock
                          ? "border-amber-200 hover:border-amber-400 hover:shadow-md"
                          : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
                      }`}
                    >
                      {/* In-Cart Badge */}
                      {inCartItem && (
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-xs z-10">
                          {inCartItem.quantity}
                        </div>
                      )}

                      {/* Quick Restock Action Button on Hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRestockProduct(p);
                          setRestockQty(10);
                          setShowRestockModal(true);
                        }}
                        className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 bg-slate-900/85 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs transition-opacity"
                        title="Quick Restock Stock"
                      >
                        <Plus size={11} />
                        <span>Restock</span>
                      </button>

                      {/* Image / Thumbnail */}
                      <div className="w-full h-28 relative rounded-lg bg-slate-100 overflow-hidden mb-2.5 flex items-center justify-center">
                        {p.image_url ? (
                          <Image
                            src={p.image_url}
                            alt={p.name}
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <Package size={32} className="text-slate-300" />
                        )}

                        {/* Stock Overlay Badge */}
                        <div className="absolute bottom-1.5 left-1.5">
                          {p.stock > 5 ? (
                            <span className="px-1.5 py-0.5 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow-2xs">
                              Stock: {p.stock}
                            </span>
                          ) : p.stock > 0 ? (
                            <span className="px-1.5 py-0.5 bg-amber-600/95 backdrop-blur-xs text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow-2xs animate-pulse">
                              <AlertTriangle size={10} />
                              Only {p.stock} left
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-rose-600/95 backdrop-blur-xs text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow-2xs">
                              Sold Out
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-0.5">
                          <span>SKU-{p.id.toString().padStart(4, "0")}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
                          {p.name}
                        </h4>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className="text-sm font-bold text-slate-900">
                            ${effectivePrice.toFixed(2)}
                          </span>
                          {discountPriceNum > 0 && (
                            <span className="text-[11px] text-slate-400 line-through">
                              ${Number(p.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: REGISTER CART & CHARGE PANEL */}
        {/* ========================================== */}
        <div className="w-96 flex flex-col bg-white border-l border-slate-200 shadow-sm flex-shrink-0">
          {/* Customer Selection Banner */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                <User size={14} />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {customerName}
                </div>
                {customerPhone ? (
                  <div className="text-[10px] text-slate-500">{customerPhone}</div>
                ) : (
                  <div className="text-[10px] text-slate-400">Regular In-Store Customer</div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowCustomerModal(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-2xs transition-colors whitespace-nowrap"
            >
              Change
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Receipt size={28} className="text-slate-300" />
                </div>
                <h5 className="font-semibold text-slate-700 text-sm">Register is empty</h5>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Tap products on the left or search by name to ring up items.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl gap-2 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold text-slate-800 truncate">
                      {item.product.name}
                    </h5>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      ${item.unitPrice.toFixed(2)} each
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="p-1 hover:bg-slate-100 rounded-md text-slate-600"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="p-1 hover:bg-slate-100 rounded-md text-slate-600"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="w-14 text-right">
                    <span className="text-xs font-bold text-slate-900">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Delete Item */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    title="Remove item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Calculation Box */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2 text-xs">
            {/* Subtotal */}
            <div className="flex justify-between text-slate-600">
              <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>

            {/* Discount Row */}
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-1.5">
                <span>Discount:</span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setDiscountPercent(d);
                        setDiscountDollar(0);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        discountPercent === d && discountDollar === 0
                          ? "bg-indigo-600 text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
              </div>
              <span className="font-semibold text-rose-600">
                -${discountAmount.toFixed(2)}
              </span>
            </div>

            {/* Tax Row */}
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-1.5">
                <span>Tax:</span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTaxRate(t)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        taxRate === t
                          ? "bg-indigo-600 text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {t}%
                    </button>
                  ))}
                </div>
              </div>
              <span className="font-semibold text-slate-700">
                +${taxAmount.toFixed(2)}
              </span>
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-900">Total Due</span>
              <span className="text-xl font-extrabold text-indigo-700 tracking-tight">
                ${grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
            {/* Hold Button */}
            <button
              onClick={parkCurrentCart}
              disabled={cart.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Park order to serve next customer"
            >
              <PauseCircle size={15} />
              <span>Hold</span>
            </button>

            {/* Clear Button */}
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="flex items-center justify-center py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear all items"
            >
              <Trash2 size={15} />
            </button>

            {/* Charge / Pay Button */}
            <button
              onClick={initiateCheckout}
              disabled={cart.length === 0}
              className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DollarSign size={17} />
              <span>Charge ${grandTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. PAYMENT MODAL                                              */}
      {/* ============================================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Point of Sale Payment</h3>
                <p className="text-xs text-slate-400">Order Total: ${grandTotal.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Payment Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setPaymentMethod("Cash")}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === "Cash"
                    ? "bg-white text-emerald-700 border-b-2 border-emerald-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <DollarSign size={15} />
                <span>Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod("Credit Card")}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === "Credit Card"
                    ? "bg-white text-indigo-700 border-b-2 border-indigo-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <CreditCard size={15} />
                <span>Card Terminal</span>
              </button>
              <button
                onClick={() => setPaymentMethod("QR Pay")}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === "QR Pay"
                    ? "bg-white text-rose-700 border-b-2 border-rose-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <QrCode size={15} />
                <span>QR Pay</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {paymentMethod === "Cash" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Cash Tendered / Received
                    </label>
                    <div className="relative">
                      <DollarSign
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="number"
                        step="any"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-lg font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Quick Cash Buttons */}
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
                      Quick Denomination Bills
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        grandTotal,
                        Math.ceil(grandTotal / 5) * 5 || 5,
                        Math.ceil(grandTotal / 10) * 10 || 10,
                        50,
                        100,
                      ]
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .slice(0, 4)
                        .map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setCashTendered(amount.toFixed(2))}
                            className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg text-xs font-bold transition-all"
                          >
                            ${amount.toFixed(2)}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Change Due Display */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-800 font-semibold block">
                        Change Due:
                      </span>
                      <span className="text-xl font-black text-emerald-700">
                        $
                        {Math.max(
                          0,
                          (parseFloat(cashTendered) || 0) - grandTotal
                        ).toFixed(2)}
                      </span>
                    </div>
                    {(parseFloat(cashTendered) || 0) >= grandTotal && (
                      <CheckCircle2 size={24} className="text-emerald-600" />
                    )}
                  </div>
                </div>
              )}

              {paymentMethod === "Credit Card" && (
                <div className="space-y-3 text-center py-4">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CreditCard size={28} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">
                    Ready for Card Terminal
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Please swipe, insert chip, or tap customer card on the POS reader device.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono text-slate-600">
                    <span>Terminal #01: Ready</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
              )}

              {paymentMethod === "QR Pay" && (
                <div className="space-y-3 text-center py-2">
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl inline-block shadow-xs">
                    {/* Simulated Dynamic Payment QR */}
                    <div className="w-36 h-36 bg-slate-900 rounded-xl flex flex-col items-center justify-center text-white p-2">
                      <QrCode size={80} className="text-white mb-1" />
                      <span className="text-[10px] font-mono font-bold tracking-wider">
                        SCAN TO PAY
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-700 font-bold block">
                      Amount: ${grandTotal.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Scan with Bakong, ABA Mobile, or Bank App
                    </span>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Sale Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Table #3, Gift wrap requested..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 px-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompletePayment}
                disabled={processingPayment}
                className="flex-[2] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {processingPayment ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Processing Sale...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Confirm Sale & Print Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. RECEIPT PRINT MODAL (THERMAL 80MM / 58MM FORMAT)           */}
      {/* ============================================================== */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div
            className={`bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all ${
              paperSize === "58mm" ? "w-full max-w-[320px]" : "w-full max-w-sm"
            }`}
          >
            {/* Header & Paper Size Toggle */}
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span className="font-bold text-xs uppercase tracking-wide">
                  Sale Completed!
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* 80mm vs 58mm Paper Toggle */}
                <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px]">
                  <button
                    onClick={() => setPaperSize("80mm")}
                    className={`px-2 py-0.5 rounded font-bold transition-all ${
                      paperSize === "80mm"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    80mm
                  </button>
                  <button
                    onClick={() => setPaperSize("58mm")}
                    className={`px-2 py-0.5 rounded font-bold transition-all ${
                      paperSize === "58mm"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    58mm
                  </button>
                </div>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Canvas */}
            <div
              id="printable-receipt"
              className={`p-5 overflow-y-auto bg-white font-mono text-xs text-slate-900 space-y-2.5 mx-auto ${
                paperSize === "58mm" ? "receipt-width-58mm text-[11px] max-w-[270px]" : "receipt-width-80mm max-w-[340px]"
              }`}
            >
              {/* Store Branding */}
              <div className="text-center space-y-0.5">
                <div className="inline-block px-2.5 py-0.5 bg-slate-900 text-white text-[11px] font-black rounded-md mb-1 tracking-wider">
                  BLUE PANDA STORE
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Official Retail POS
                </p>
                <p className="text-[10px] text-slate-400">
                  Tel: +855 23 999 888 • Phnom Penh
                </p>
                <div className="pt-1">
                  <p className="text-[11px] font-bold text-slate-800">
                    Receipt #{activeReceipt.order_number}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(activeReceipt.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Cashier & Customer Info */}
              <div className="border-t border-dashed border-slate-300 pt-2 text-[10.5px] space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cashier:</span>
                  <span className="font-semibold">{activeReceipt.cashier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold">{activeReceipt.customer_name}</span>
                </div>
                {activeReceipt.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span>{activeReceipt.customer_phone}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1 text-[11px]">
                {activeReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="truncate pr-2">
                      <span className="font-medium text-slate-800">{item.product_name}</span>
                      <div className="text-[10px] text-slate-400">
                        {item.quantity} × ${Number(item.price).toFixed(2)}
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">
                      ${Number(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span>${Number(activeReceipt.subtotal).toFixed(2)}</span>
                </div>
                {Number(activeReceipt.discount_amount) > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Discount:</span>
                    <span>-${Number(activeReceipt.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                {Number(activeReceipt.tax_amount) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax:</span>
                    <span>+${Number(activeReceipt.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1.5 border-t border-slate-400 text-slate-900">
                  <span>TOTAL:</span>
                  <span>${Number(activeReceipt.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Tendered ({activeReceipt.payment_method}):</span>
                  <span>${Number(activeReceipt.amount_paid).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Change Due:</span>
                  <span>${Number(activeReceipt.change_due).toFixed(2)}</span>
                </div>
              </div>

              {/* Barcode Section */}
              <div className="border-t border-dashed border-slate-300 pt-2 text-center">
                <SvgBarcode value={activeReceipt.order_number} />
              </div>

              {/* Footer message */}
              <div className="border-t border-dashed border-slate-300 pt-2 text-center space-y-0.5">
                <p className="text-[10px] text-slate-600 font-semibold">
                  Thank you for shopping with us!
                </p>
                <p className="text-[9px] text-slate-400">
                  Keep receipt for returns or exchanges within 7 days.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
              <button
                onClick={printReceipt}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer size={15} />
                <span>Print ({paperSize})</span>
              </button>
              <button
                onClick={copyReceiptToClipboard}
                className="py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                title="Copy plain text to clipboard"
              >
                {copiedReceipt ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedReceipt ? "Copied" : "Copy"}</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Sparkles size={15} />
                <span>New Sale</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. QUICK RESTOCK MODAL (INVENTORY SHORTCUT IN POS)             */}
      {/* ============================================================== */}
      {showRestockModal && restockProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warehouse size={16} className="text-indigo-400" />
                <h3 className="font-bold text-sm">Quick Restock Inventory</h3>
              </div>
              <button
                onClick={() => setShowRestockModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs text-slate-400 block">Product</span>
                <span className="font-bold text-slate-800 text-sm block">
                  {restockProduct.name}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Current Stock: {restockProduct.stock} units
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Add Quantity
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {[5, 10, 20, 50].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setRestockQty(qty)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        restockQty === qty
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex justify-between items-center">
                <span>New Total Stock:</span>
                <span className="font-black text-sm">
                  {restockProduct.stock + Number(restockQty)} units
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => setShowRestockModal(false)}
                className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickRestock}
                disabled={isRestocking}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isRestocking ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Confirm Restock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. CUSTOMER LOOKUP MODAL                                      */}
      {/* ============================================================== */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Select Customer Account</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type name, phone or email..."
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Default Walk-in Button */}
              <button
                onClick={() => {
                  setCustomerName("Walk-in Customer");
                  setCustomerPhone("");
                  setSelectedCustomerId(null);
                  setShowCustomerModal(false);
                }}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block">Walk-in Customer (Default)</span>
                  <span className="text-[10px] text-slate-400">No account linked</span>
                </div>
                <span className="text-[11px] font-semibold text-indigo-600">Select</span>
              </button>

              {/* Results List */}
              <div className="max-h-56 overflow-y-auto space-y-1.5">
                {searchingCustomers ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    <RefreshCw size={14} className="animate-spin inline mr-1" />
                    Searching customers...
                  </div>
                ) : (
                  customerResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="w-full p-2.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl text-left flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">{c.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {c.email} {c.phone ? `• ${c.phone}` : ""}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-indigo-600">Attach</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. PARKED CARTS MODAL                                         */}
      {/* ============================================================== */}
      {showParkedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Parked / Held Orders</h3>
              <button
                onClick={() => setShowParkedModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {parkedCarts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  <PauseCircle size={32} className="mx-auto text-slate-300 mb-2" />
                  No held orders. When customers need more time, click "Hold" to park their cart.
                </div>
              ) : (
                parkedCarts.map((p) => {
                  const totalItems = p.items.reduce((a, b) => a + b.quantity, 0);
                  const totalVal = p.items.reduce((a, b) => a + b.unitPrice * b.quantity, 0);
                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-800">{p.customerName}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono">
                            {p.id}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {totalItems} items • ${totalVal.toFixed(2)} • Held at {p.timestamp}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => resumeParkedCart(p)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Resume
                        </button>
                        <button
                          onClick={() => setParkedCarts((prev) => prev.filter((x) => x.id !== p.id))}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. REGISTER SUMMARY & CASH DRAWER SHIFT REPORT (Z-REPORT)     */}
      {/* ============================================================== */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Register & Shift Closeout</h3>
                <p className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sub-Tabs: Sales Summary vs Shift Drawer Balancing */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
              <button
                onClick={() => setShiftReportView(false)}
                className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                  !shiftReportView
                    ? "border-indigo-600 text-indigo-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Today&apos;s Sales Summary
              </button>
              <button
                onClick={() => setShiftReportView(true)}
                className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                  shiftReportView
                    ? "border-indigo-600 text-indigo-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Cash Drawer (Z-Report)
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {loadingSummary ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-500" />
                  Calculating register metrics...
                </div>
              ) : dailySummary ? (
                !shiftReportView ? (
                  <>
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                      <span className="text-xs font-medium text-indigo-600 block">
                        Total In-Store Sales Today
                      </span>
                      <span className="text-2xl font-black text-indigo-900 mt-1 block">
                        ${Number(dailySummary.today_total_sales).toFixed(2)}
                      </span>
                      <span className="text-[11px] text-indigo-500 mt-0.5 block">
                        Across {dailySummary.today_orders_count} transactions
                      </span>
                    </div>

                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <DollarSign size={14} className="text-emerald-600" />
                          Cash Collected
                        </span>
                        <span className="font-bold text-slate-800">
                          ${Number(dailySummary.today_cash_sales).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <CreditCard size={14} className="text-indigo-600" />
                          Card Payments
                        </span>
                        <span className="font-bold text-slate-800">
                          ${Number(dailySummary.today_card_sales).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <QrCode size={14} className="text-rose-600" />
                          QR / Mobile Pay
                        </span>
                        <span className="font-bold text-slate-800">
                          ${Number(dailySummary.today_qr_sales).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Shift Drawer Reconciliation (Z-Report) */
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Opening Float ($):</span>
                        <input
                          type="number"
                          step="any"
                          value={openingFloat}
                          onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-right font-bold border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Cash Sales Today:</span>
                        <span className="font-bold text-slate-800">
                          +${Number(dailySummary.today_cash_sales).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                        <span>Expected Cash in Drawer:</span>
                        <span className="text-indigo-600">
                          ${(openingFloat + Number(dailySummary.today_cash_sales)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Actual Cash Counted in Drawer ($)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Enter counted physical cash..."
                        value={actualCashCount}
                        onChange={(e) => setActualCashCount(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    {actualCashCount !== "" && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          parseFloat(actualCashCount) -
                            (openingFloat + Number(dailySummary.today_cash_sales)) >=
                          0
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                      >
                        <span className="font-semibold">Drawer Variance:</span>
                        <span className="font-black text-sm">
                          {(() => {
                            const diff =
                              parseFloat(actualCashCount) -
                              (openingFloat + Number(dailySummary.today_cash_sales));
                            if (Math.abs(diff) < 0.01) return "✅ $0.00 (Balanced)";
                            return diff > 0
                              ? `+$${diff.toFixed(2)} (Over)`
                              : `-$${Math.abs(diff).toFixed(2)} (Short)`;
                          })()}
                        </span>
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        onClick={() => window.print()}
                        className="w-full py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Printer size={14} />
                        <span>Print Shift Z-Report</span>
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No summary data available.
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
