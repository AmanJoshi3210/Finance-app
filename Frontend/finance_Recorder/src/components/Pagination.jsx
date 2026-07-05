// src/components/Pagination.jsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DOTS = "...";

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function getPageList(current, total, siblingCount = 1) {
  const totalPageNumbers = siblingCount * 2 + 5;

  if (totalPageNumbers >= total) {
    return range(1, total);
  }

  const leftSiblingIndex = Math.max(current - siblingCount, 1);
  const rightSiblingIndex = Math.min(current + siblingCount, total);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < total - 2;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftRange = range(1, 3 + siblingCount * 2);
    return [...leftRange, DOTS, total];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightRange = range(total - (3 + siblingCount * 2) + 1, total);
    return [1, DOTS, ...rightRange];
  }

  return [1, DOTS, ...range(leftSiblingIndex, rightSiblingIndex), DOTS, total];
}

// Generic pagination control: page numbers with ellipsis + prev/next + a
// "Showing X-Y of Z" summary. Purely presentational — the caller owns page state.
export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = getPageList(page, totalPages);
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-1">
      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{start}-{end}</span> of{" "}
        <span className="font-medium text-slate-700">{totalItems}</span> records
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, idx) =>
          p === DOTS ? (
            <span key={`dots-${idx}`} className="px-2 text-slate-400 text-sm select-none">
              {DOTS}
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`min-w-[2.25rem] px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
