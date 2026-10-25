"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Eye,
  Star,
  MessageSquare,
  Check,
  X,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  CornerDownRight,
  Package,
} from "lucide-react";
import { reviewsApi, ApiReview } from "@/lib/api";

const statusFilters = ["All", "pending", "approved", "rejected"];
const ratingFilters = ["All", "5", "4", "3", "2", "1"];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewsApi.list();
      setReviews(res.data || []);
    } catch (err: any) {
      console.error("Failed to load reviews:", err);
      showToast(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleStatusChange = async (reviewId: number, newStatus: string) => {
    setUpdatingId(reviewId);
    try {
      const res = await reviewsApi.updateStatus(reviewId, newStatus);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? res.data : r))
      );
      showToast(`Review #${reviewId} marked as ${newStatus}`);
    } catch (err: any) {
      showToast(err.message || "Failed to update review status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalId) return;
    try {
      await reviewsApi.delete(deleteModalId);
      setReviews((prev) => prev.filter((r) => r.id !== deleteModalId));
      showToast(`Review #${deleteModalId} deleted from database`);
      setDeleteModalId(null);
    } catch (err: any) {
      showToast(err.message || "Failed to delete review");
    }
  };

  // Filtered reviews
  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const prodName = r.product?.name || "";
      const custName = r.user?.name || "";
      const custEmail = r.user?.email || "";
      const comment = r.comment || "";
      const matchSearch =
        prodName.toLowerCase().includes(search.toLowerCase()) ||
        custName.toLowerCase().includes(search.toLowerCase()) ||
        custEmail.toLowerCase().includes(search.toLowerCase()) ||
        comment.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "All" ||
        r.status.toLowerCase() === statusFilter.toLowerCase();

      const matchRating =
        ratingFilter === "All" || r.rating === Number(ratingFilter);

      return matchSearch && matchStatus && matchRating;
    });
  }, [reviews, search, statusFilter, ratingFilter]);

  // Metrics
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedReviews = reviews.filter((r) => r.status === "approved");
  const approvedCount = approvedReviews.length;
  const avgRating =
    approvedCount > 0
      ? (
          approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedCount
        ).toFixed(1)
      : "0.0";

  const getStatusStyle = (status: string) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={
              star <= rating
                ? "text-amber-400 fill-amber-400"
                : "text-gray-200"
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews & Moderation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real customer reviews and ratings synchronized live with PostgreSQL
          </p>
        </div>
        <button
          onClick={loadReviews}
          disabled={loading}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition self-start sm:self-auto flex items-center gap-2 text-sm font-medium shadow-sm cursor-pointer"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-[#7699F0]" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Reviews</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{reviews.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#7699F0] flex items-center justify-center">
            <MessageSquare size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Moderation</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Approved Reviews</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Average Rating</p>
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-2xl font-bold text-gray-900">{avgRating}</p>
              <span className="text-amber-400 text-lg">★</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Star size={20} className="fill-amber-400 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by product name, customer name, email, or comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 mr-1">Status:</span>
            {statusFilters.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all capitalize cursor-pointer ${
                  statusFilter === status
                    ? "bg-[#7699F0] text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {status}
                {status !== "All" && (
                  <span className="ml-1 opacity-80">
                    ({reviews.filter((r) => r.status.toLowerCase() === status.toLowerCase()).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 mr-1">Rating:</span>
            {ratingFilters.map((rating) => (
              <button
                key={rating}
                onClick={() => setRatingFilter(rating)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  ratingFilter === rating
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {rating === "All" ? "All Stars" : `${rating} ★`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-8 h-8 border-3 border-[#7699F0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading reviews from PostgreSQL...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((review) => {
            const dateStr = review.created_at
              ? new Date(review.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recent";

            return (
              <div
                key={review.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                  {/* Left: Product & Customer info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 flex items-center justify-center">
                      {review.product?.image_url ? (
                        <img
                          src={review.product.image_url}
                          alt={review.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={22} className="text-gray-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${review.product_id}`}
                        className="font-bold text-gray-900 hover:text-[#7699F0] transition truncate block"
                      >
                        {review.product?.name || `Product #${review.product_id}`}
                      </Link>

                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-[#7699F0] font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
                          {review.user?.name ? review.user.name.charAt(0) : "U"}
                        </div>
                        <span className="font-medium text-gray-800 truncate">
                          {review.user?.name || `Customer #${review.user_id}`}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-400">{dateStr}</span>
                        {review.order_id && (
                          <>
                            <span className="text-gray-300">•</span>
                            <Link
                              href={`/admin/orders/${review.order_id}`}
                              className="text-[#7699F0] hover:underline"
                            >
                              #ORD-{review.order_id}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Rating & Status */}
                  <div className="flex items-center gap-3 shrink-0 self-start">
                    {renderStars(review.rating)}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusStyle(
                        review.status
                      )}`}
                    >
                      {review.status}
                    </span>
                  </div>
                </div>

                {/* Review Comment */}
                <div className="bg-gray-50/70 rounded-xl p-3.5 border border-gray-100">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>

                {/* Admin Reply (if present) */}
                {review.admin_reply && (
                  <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-100 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#7699F0]">
                      <CornerDownRight size={14} /> Store Response
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {review.admin_reply}
                    </p>
                  </div>
                )}

                {/* Card Action Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/reviews/${review.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      <Eye size={14} /> View & Reply
                    </Link>

                    {review.status === "pending" && (
                      <>
                        <button
                          disabled={updatingId === review.id}
                          onClick={() => handleStatusChange(review.id, "approved")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          disabled={updatingId === review.id}
                          onClick={() => handleStatusChange(review.id, "rejected")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                        >
                          <X size={14} /> Reject
                        </button>
                      </>
                    )}

                    {review.status === "rejected" && (
                      <button
                        disabled={updatingId === review.id}
                        onClick={() => handleStatusChange(review.id, "approved")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                      >
                        <Check size={14} /> Approve Review
                      </button>
                    )}

                    {review.status === "approved" && (
                      <button
                        disabled={updatingId === review.id}
                        onClick={() => handleStatusChange(review.id, "rejected")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                      >
                        <X size={14} /> Reject
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setDeleteModalId(review.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="text-gray-300" size={32} />
          </div>
          <p className="text-gray-800 font-bold">No reviews found</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "All" || ratingFilter !== "All"
              ? "No reviews matched your current search and filter settings."
              : "When customers review products on mobile or web, they will appear here live for moderation."}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">Delete Review #{deleteModalId}?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete this customer review from PostgreSQL? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition text-sm shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}