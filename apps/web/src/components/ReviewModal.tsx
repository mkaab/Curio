"use client";

import { useState } from "react";
import { Button } from "@curio/ui";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  isProcessing?: boolean;
}

export function ReviewModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isProcessing = false 
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(rating, comment.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
        <div className="p-6 border-b border-surface-container flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-primary">Leave a Review</h2>
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="h-8 w-8 rounded-full hover:bg-surface-dim flex items-center justify-center text-on-surface-variant transition-colors"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex flex-col items-center">
            <label className="block text-sm font-bold text-on-surface-variant mb-3">How was your experience?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="40" 
                    height="40" 
                    viewBox="0 0 24 24" 
                    fill={(hoveredRating || rating) >= star ? "#eab308" : "none"} 
                    stroke={(hoveredRating || rating) >= star ? "#eab308" : "#cbd5e1"} 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="transition-colors duration-200"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>
            <div className="text-xs font-bold text-primary mt-2">
              {rating === 1 && "Terrible"}
              {rating === 2 && "Poor"}
              {rating === 3 && "Average"}
              {rating === 4 && "Good"}
              {rating === 5 && "Excellent"}
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold text-primary">Write a comment</label>
              <span className={`text-xs font-semibold ${comment.length > 200 ? 'text-red-500' : 'text-surface-tint'}`}>
                {comment.length}/200
              </span>
            </div>
            <textarea 
              required
              maxLength={200}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 bg-surface-bright border border-surface-container rounded-xl focus:outline-none focus:border-primary transition-colors text-sm font-medium min-h-[100px] resize-y"
              placeholder="Tell others what you loved or didn't like about this transaction..."
            />
          </div>
          
          <div className="pt-4 flex gap-3 border-t border-surface-container">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 rounded-xl h-12 font-bold"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 rounded-xl h-12 font-bold bg-primary hover:bg-primary-container text-on-primary"
              disabled={isProcessing || comment.trim().length === 0 || comment.length > 200}
            >
              {isProcessing ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
