import { getAccessToken, logout } from "./auth";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
}

export interface ApiCategory {
  id: number;
  name: string;
  description?: string | null;
  image?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiSellerSummary {
  id: number;
  name: string;
  owner_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
  rating: number;
  status: string;
}

export interface ApiProduct {
  id: number;
  category_id: number;
  seller_id?: number | null;
  name: string;
  description?: string | null;
  price: number | string;
  discount_price?: number | string | null;
  stock: number;
  image_url?: string | null;
  rating: number | string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  category?: ApiCategory | null;
  seller?: ApiSellerSummary | null;
}

export interface ApiProductPagination {
  items: ApiProduct[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiCoupon {
  id: number;
  code: string;
  description?: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number | null;
  is_active: boolean;
}

export interface DashboardStats {
  total_products: number;
  total_categories: number;
  total_orders: number;
  pending_orders_count?: number;
  processing_orders_count?: number;
  delivered_orders_count?: number;
  total_users: number;
  total_revenue: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface ApiOrderItem {
  id: number;
  order_id: number;
  product_id?: number | null;
  product_name: string;
  price: number | string;
  quantity: number;
  subtotal: number | string;
  created_at: string;
}

export interface ApiOrder {
  id: number;
  user_id: number;
  user?: ApiUser | null;
  status: string;
  subtotal: number | string;
  discount_amount: number | string;
  coupon_code?: string | null;
  shipping_fee: number | string;
  total: number | string;
  payment_method: string;
  payment_status: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
  items: ApiOrderItem[];
}

export interface ApiReview {
  id: number;
  product_id: number;
  user_id: number;
  order_id?: number | null;
  rating: number;
  comment: string;
  status: string;
  admin_reply?: string | null;
  admin_replied_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: ApiUser | null;
  product?: ApiProduct | null;
}

export interface ApiSeller {
  id: number;
  user_id?: number | null;
  name: string;
  owner_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  description?: string | null;
  logo?: string | null;
  status: string;
  rating: number;
  products_count: number;
  orders_count: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}



/**
 * Generic HTTP client with JWT token attachment and error extraction
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (typeof window !== "undefined") {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      logout();
      if (
        window.location.pathname.startsWith("/admin") ||
        window.location.pathname.startsWith("/account")
      ) {
        if (!window.location.pathname.includes("/login")) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}&expired=true`;
        }
      }
    }

    const errorMessage =
      json.detail || json.message || `Request failed with status ${response.status}`;
    throw new Error(
      typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage)
    );
  }

  return json;
}

// ==========================================
// Authentication APIs
// ==========================================
export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<ApiResponse<AuthResponse>> => {
    return request<ApiResponse<AuthResponse>>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  register: async (data: { name: string; email: string; password: string; phone?: string }): Promise<ApiResponse<AuthResponse>> => {
    return request<ApiResponse<AuthResponse>>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMe: async (): Promise<ApiResponse<ApiUser>> => {
    return request<ApiResponse<ApiUser>>("/auth/me");
  },

  updateMe: async (data: Partial<ApiUser>): Promise<ApiResponse<ApiUser>> => {
    return request<ApiResponse<ApiUser>>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// ==========================================
// Product APIs
// ==========================================
export const productsApi = {
  list: async (params?: {
    category_id?: number;
    search?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ApiProductPagination>> => {
    const query = new URLSearchParams();
    if (params?.category_id) query.append("category_id", params.category_id.toString());
    if (params?.search) query.append("search", params.search);
    if (params?.min_price !== undefined) query.append("min_price", params.min_price.toString());
    if (params?.max_price !== undefined) query.append("max_price", params.max_price.toString());
    if (params?.sort) query.append("sort", params.sort);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<ApiResponse<ApiProductPagination>>(`/products${queryString}`);
  },

  get: async (id: number): Promise<ApiResponse<ApiProduct>> => {
    return request<ApiResponse<ApiProduct>>(`/products/${id}`);
  },

  create: async (data: {
    category_id: number;
    seller_id?: number | null;
    name: string;
    description?: string;
    price: number;
    discount_price?: number | null;
    stock: number;
    image_url?: string;
    rating?: number;
    is_active?: boolean;
  }): Promise<ApiResponse<ApiProduct>> => {
    return request<ApiResponse<ApiProduct>>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: Partial<{
      category_id: number;
      seller_id: number | null;
      name: string;
      description: string;
      price: number;
      discount_price: number | null;
      stock: number;
      image_url: string;
      is_active: boolean;
    }>
  ): Promise<ApiResponse<ApiProduct>> => {
    return request<ApiResponse<ApiProduct>>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return request<ApiResponse<null>>(`/products/${id}`, {
      method: "DELETE",
    });
  },
};

// ==========================================
// Category APIs
// ==========================================
export const categoriesApi = {
  list: async (active_only?: boolean): Promise<ApiResponse<ApiCategory[]>> => {
    const url = active_only !== undefined ? `/categories?active_only=${active_only}` : "/categories";
    return request<ApiResponse<ApiCategory[]>>(url);
  },

  get: async (id: number): Promise<ApiResponse<ApiCategory>> => {
    return request<ApiResponse<ApiCategory>>(`/categories/${id}`);
  },

  create: async (data: {
    name: string;
    description?: string;
    image?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<ApiCategory>> => {
    return request<ApiResponse<ApiCategory>>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: {
      name: string;
      description?: string;
      image?: string;
      is_active?: boolean;
    }
  ): Promise<ApiResponse<ApiCategory>> => {
    return request<ApiResponse<ApiCategory>>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return request<ApiResponse<null>>(`/categories/${id}`, {
      method: "DELETE",
    });
  },
};

// ==========================================
// Orders & Vouchers APIs
// ==========================================
export const ordersApi = {
  list: async (): Promise<ApiResponse<ApiOrder[]>> => {
    return request<ApiResponse<ApiOrder[]>>("/orders");
  },

  listAll: async (): Promise<ApiResponse<ApiOrder[]>> => {
    return request<ApiResponse<ApiOrder[]>>("/orders/all");
  },

  get: async (id: number): Promise<ApiResponse<ApiOrder>> => {
    return request<ApiResponse<ApiOrder>>(`/orders/${id}`);
  },

  updateStatus: async (
    id: number,
    data: { status?: string; payment_status?: string }
  ): Promise<ApiResponse<ApiOrder>> => {
    return request<ApiResponse<ApiOrder>>(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return request<ApiResponse<null>>(`/orders/${id}`, {
      method: "DELETE",
    });
  },
};

export const couponsApi = {
  available: async (): Promise<ApiResponse<ApiCoupon[]>> => {
    return request<ApiResponse<ApiCoupon[]>>("/coupons/available");
  },
};

// ==========================================
// Reviews & Ratings APIs
// ==========================================
export const reviewsApi = {
  list: async (params?: {
    status?: string;
    rating?: number;
    product_id?: number;
  }): Promise<ApiResponse<ApiReview[]>> => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "All") query.append("status", params.status);
    if (params?.rating) query.append("rating", params.rating.toString());
    if (params?.product_id) query.append("product_id", params.product_id.toString());
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<ApiResponse<ApiReview[]>>(`/reviews${qs}`);
  },

  get: async (id: number): Promise<ApiResponse<ApiReview>> => {
    return request<ApiResponse<ApiReview>>(`/reviews/${id}`);
  },

  create: async (
    productId: number,
    data: { rating: number; comment: string; order_id?: number }
  ): Promise<ApiResponse<ApiReview>> => {
    return request<ApiResponse<ApiReview>>(`/reviews/product/${productId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (
    id: number,
    status: string
  ): Promise<ApiResponse<ApiReview>> => {
    return request<ApiResponse<ApiReview>>(`/reviews/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  reply: async (
    id: number,
    admin_reply: string
  ): Promise<ApiResponse<ApiReview>> => {
    return request<ApiResponse<ApiReview>>(`/reviews/${id}/reply`, {
      method: "PUT",
      body: JSON.stringify({ admin_reply }),
    });
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return request<ApiResponse<null>>(`/reviews/${id}`, {
      method: "DELETE",
    });
  },
};

// ==========================================
// Users & Customers APIs
// ==========================================
export const usersApi = {
  list: async (role?: string): Promise<ApiResponse<ApiUser[]>> => {
    const url = role ? `/users?role=${encodeURIComponent(role)}` : "/users";
    return request<ApiResponse<ApiUser[]>>(url);
  },

  get: async (id: number): Promise<ApiResponse<ApiUser>> => {
    return request<ApiResponse<ApiUser>>(`/users/${id}`);
  },

  create: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    avatar?: string;
    role?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<ApiUser>> => {
    return request<ApiResponse<ApiUser>>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      avatar?: string;
      role?: string;
      is_active?: boolean;
      password?: string;
    }
  ): Promise<ApiResponse<ApiUser>> => {
    return request<ApiResponse<ApiUser>>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return request<ApiResponse<null>>(`/users/${id}`, {
      method: "DELETE",
    });
  },
};

// ==========================================
// Sellers APIs
// ==========================================
export const sellersApi = {
  list: async (params?: { status?: string; search?: string }): Promise<ApiResponse<ApiSeller[]>> => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "All") query.append("status", params.status);
    if (params?.search) query.append("search", params.search);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<ApiResponse<ApiSeller[]>>(`/sellers${qs}`);
  },

  get: async (id: number): Promise<ApiResponse<ApiSeller>> => {
    return request<ApiResponse<ApiSeller>>(`/sellers/${id}`);
  },

  create: async (data: {
    name: string;
    owner_name: string;
    email: string;
    phone?: string;
    address?: string;
    description?: string;
    logo?: string;
    status?: string;
    password?: string;
  }): Promise<ApiResponse<ApiSeller>> => {
    return request<ApiResponse<ApiSeller>>("/sellers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: Partial<{
      name: string;
      owner_name: string;
      email: string;
      phone: string;
      address: string;
      description: string;
      logo: string;
      status: string;
    }>
  ): Promise<ApiResponse<ApiSeller>> => {
    return request<ApiResponse<ApiSeller>>(`/sellers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return request<ApiResponse<null>>(`/sellers/${id}`, {
      method: "DELETE",
    });
  },
};

// ==========================================
// Dashboard Statistics API
// ==========================================
export const statsApi = {
  getOverview: async (): Promise<ApiResponse<DashboardStats>> => {
    return request<ApiResponse<DashboardStats>>("/stats/overview");
  },
};

// ==========================================
// Media & File Upload API
// ==========================================
export const uploadApi = {
  uploadImage: async (file: File): Promise<ApiResponse<{ filename: string; url: string; relative_url: string }>> => {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${API_BASE_URL}/upload/image`;
    const headers: Record<string, string> = {};

    if (typeof window !== "undefined") {
      const token = getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        logout();
      }
      const errorMessage =
        json.detail || json.message || `Upload failed with status ${response.status}`;
      throw new Error(
        typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage)
      );
    }

    return json;
  },
};

// ==========================================
// Notifications API
// ==========================================
export interface ApiNotification {
  id: number;
  user_id: number | null;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export const notificationsApi = {
  getAll: async (params?: {
    type?: string;
    unread_only?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<ApiResponse<ApiNotification[]> & { unread_count?: number }> => {
    const searchParams = new URLSearchParams();
    if (params?.type && params.type !== "all" && params.type !== "All") {
      searchParams.append("type", params.type.toLowerCase());
    }
    if (params?.unread_only) {
      searchParams.append("unread_only", "true");
    }
    if (params?.skip) {
      searchParams.append("skip", String(params.skip));
    }
    if (params?.limit) {
      searchParams.append("limit", String(params.limit));
    }
    const qs = searchParams.toString();
    return request<ApiResponse<ApiNotification[]> & { unread_count?: number }>(
      `/notifications${qs ? `?${qs}` : ""}`
    );
  },

  getUnreadCount: async (): Promise<{ success: boolean; unread_count: number }> => {
    return request<{ success: boolean; unread_count: number }>("/notifications/unread-count");
  },

  markAsRead: async (id: number): Promise<ApiResponse<ApiNotification>> => {
    return request<ApiResponse<ApiNotification>>(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  markAllAsRead: async (): Promise<{ success: boolean; message: string; updated_count: number }> => {
    return request<{ success: boolean; message: string; updated_count: number }>("/notifications/read-all", {
      method: "POST",
    });
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return request<ApiResponse<null>>(`/notifications/${id}`, {
      method: "DELETE",
    });
  },

  clearAll: async (): Promise<{ success: boolean; message: string; deleted_count: number }> => {
    return request<{ success: boolean; message: string; deleted_count: number }>("/notifications", {
      method: "DELETE",
    });
  },

  create: async (data: {
    type?: string;
    title: string;
    message: string;
    link?: string;
    user_id?: number | null;
  }): Promise<ApiResponse<ApiNotification>> => {
    return request<ApiResponse<ApiNotification>>("/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ==========================================
// Point of Sale (POS) APIs
// ==========================================
export interface PosItemInput {
  product_id: number;
  quantity: number;
  price?: number;
}

export interface PosCheckoutRequest {
  items: PosItemInput[];
  customer_id?: number | null;
  customer_name?: string;
  customer_phone?: string;
  payment_method: string;
  amount_paid: number;
  change_due: number;
  discount_amount?: number;
  tax_amount?: number;
  notes?: string;
}

export interface PosReceiptItem {
  product_id: number | null;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface PosReceipt {
  order_id: number;
  order_number: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_fee: number;
  total: number;
  payment_method: string;
  payment_status: string;
  amount_paid: number;
  change_due: number;
  customer_name: string;
  customer_phone?: string;
  cashier_name: string;
  notes?: string;
  created_at: string;
  items: PosReceiptItem[];
}

export interface PosSummary {
  date: string;
  today_orders_count: number;
  today_total_sales: number;
  today_cash_sales: number;
  today_card_sales: number;
  today_qr_sales: number;
}

export const posApi = {
  checkout: async (data: PosCheckoutRequest): Promise<ApiResponse<PosReceipt>> => {
    return request<ApiResponse<PosReceipt>>("/pos/checkout", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getSummary: async (): Promise<ApiResponse<PosSummary>> => {
    return request<ApiResponse<PosSummary>>("/pos/summary");
  },

  searchCustomers: async (
    q: string = ""
  ): Promise<ApiResponse<Array<{ id: number; name: string; email: string; phone?: string }>>> => {
    return request<ApiResponse<Array<{ id: number; name: string; email: string; phone?: string }>>>(
      `/pos/customers?q=${encodeURIComponent(q)}`
    );
  },
};




