"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Check,
  X,
  Trash2,
  Package,
  Calendar,
  AlertCircle,
  CheckCircle2,
  CornerDownRight,
  Send,
  RefreshCw,
  Clock,
} from "lucide-react";
import { reviewsApi, ApiReview } from "@/lib/api";

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;
  const reviewId = Number(rawId);

  const [review, setReview] = useState<ApiReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadReview = useCallback(async () => {
    if (isNaN(reviewId)) {
      setError("Invalid Review ID format");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await reviewsApi.get(reviewId);
      setReview(res.data);
      setReplyText(res.data.admin_reply || "");
    } catch (err: any) {
      console.error("Failed to load review:", err);
      setError(err.message || "Review not found in PostgreSQL database");
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  const handleStatusChange = async (newStatus: string) => {
    if (!review) return;
    setUpdating(true);
    try {
      const res = await reviewsApi.updateStatus(review.id, newStatus);
      setReview(res.data);
      showToast(`Review status updated to '${newStatus}' in database`);
    } catch (err: any) {
      showToast(err.message || "Failed to update review status");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!review || !replyText.trim()) return;

    setSavingReply(true);
    try {
      const res = await reviewsApi.reply(review.id, replyText.trim());
      setReview(res.data);
      showToast("Store reply saved successfully");
    } catch (err: any) {
      showToast(err.message || "Failed to save reply");
    } finally {
      setSavingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!review) return;
    try {
      await reviewsApi.delete(review.id);
      router.push("/admin/reviews");
    } catch (err: any) {
      showToast(err.message || "Failed to delete review");
      setShowDeleteModal(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={20}
            className={
              star <= rating
                ? "text-amber-400 fill-amber-400"
                : "text-gray-200"
            }
          />
        ))}
        <span className="ml-2 text-sm font-bold text-gray-700">
          {rating}.0
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-3 border-[#7699F0] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Loading review #{rawId} from PostgreSQL...</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Review Not Found</h2>
        <p className="text-sm text-gray-500">{error || "Could not retrieve the requested review."}</p>
        <Link
          href="/admin/reviews"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7699F0] text-white font-medium hover:bg-[#6085e6] transition text-sm shadow-sm"
        >
          <ArrowLeft size={16} />
          Back to Reviews List
        </Link>
      </div>
    );
  }

  const currentStatus = (review.status || "pending").toLowerCase();
  const dateFormatted = review.created_at
    ? new Date(review.created_at).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/reviews"
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900">Review #{review.id}</h1>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  currentStatus === "approved"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : currentStatus === "rejected"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {review.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Submitted on {dateFormatted}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {currentStatus !== "approved" && (
            <button
              disabled={updating}
              onClick={() => handleStatusChange("approved")}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition cursor-pointer"
            >
              <Check size={16} /> Approve
            </button>
          )}

          {currentStatus !== "rejected" && (
            <button
              disabled={updating}
              onClick={() => handleStatusChange("rejected")}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition cursor-pointer"
            >
              <X size={16} /> Reject
            </button>
          )}

          {currentStatus !== "pending" && (
            <button
              disabled={updating}
              onClick={() => handleStatusChange("pending")}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition cursor-pointer"
            >
              <Clock size={16} /> Set Pending
            </button>
          )}

          <button
            onClick={loadReview}
            disabled={updating}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition shadow-sm"
            title="Refresh Review"
          >
            <RefreshCw size={16} className={updating ? "animate-spin text-[#7699F0]" : ""} />
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition shadow-sm"
            title="Delete Review"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Review Body Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer Rating</p>
          {renderStars(review.rating)}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Review Content</p>
          <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
            <p className="text-gray-800 text-base leading-relaxed">
              &ldquo;{review.comment}&rdquo;
            </p>
          </div>
        </div>

        {/* Meta Info Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#7699F0] flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Created At</p>
              <p className="text-sm font-semibold text-gray-900">{dateFormatted}</p>
            </div>
          </div>

          {review.order_id && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Package size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Associated Order</p>
                <Link
                  href={`/admin/orders/${review.order_id}`}
                  className="text-sm font-bold text-[#7699F0] hover:underline"
                >
                  #ORD-{review.order_id} ↗
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Store Response / Reply Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#7699F0] flex items-center justify-center">
            <CornerDownRight size={18} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-base">Official Store Response</h2>
            <p className="text-xs text-gray-500">
              Reply to this customer review to show support and address feedback
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveReply} className="space-y-3 pt-2">
          <textarea
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write an official response to this customer (e.g., 'Thank you for your feedback! We are glad you love the sound quality...')..."
            className="w-full p-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7699F0] transition leading-relaxed"
          />

          <div className="flex items-center justify-between">
            {review.admin_replied_at ? (
              <span className="text-xs text-gray-400">
                Last replied: {new Date(review.admin_replied_at).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}
              </span>
            ) : (
              <span className="text-xs text-gray-400">No response sent yet</span>
            )}

            <button
              type="submit"
              disabled={savingReply || !replyText.trim()}
              className="px-5 py-2.5 bg-[#7699F0] hover:bg-[#6085e6] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Send size={14} className={savingReply ? "animate-spin" : ""} />
              {review.admin_reply ? "Update Response" : "Send Response"}
            </button>
          </div>
        </form>
      </div>

      {/* Product & Customer Associated Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Product Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reviewed Product</p>
          <Link
            href={`/admin/products/${review.product_id}`}
            className="flex items-center gap-3.5 hover:bg-gray-50 p-2 rounded-xl transition group"
          >
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
              <p className="font-bold text-gray-900 group-hover:text-[#7699F0] transition truncate">
                {review.product?.name || `Product #${review.product_id}`}
              </p>
              <p className="text-xs text-[#7699F0] font-medium mt-0.5">
                View Product Details ↗
              </p>
            </div>
          </Link>
        </div>

        {/* Customer Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer Reviewer</p>
          <div className="flex items-center gap-3.5 p-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#7699F0] font-bold text-base flex items-center justify-center uppercase shrink-0">
              {review.user?.name ? review.user.name.charAt(0) : "U"}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">
                {review.user?.name || `Customer #${review.user_id}`}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {review.user?.email || "No email available"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">Delete Review #{review.id}?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete this customer review from PostgreSQL? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition text-sm shadow-sm"
              >
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}