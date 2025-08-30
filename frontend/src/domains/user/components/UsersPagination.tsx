// frontend/src/domains/user/components/UsersPagination.tsx
// Users Pagination Component - Following RestaurantIQ patterns

import { Button } from '../../../components/ui/Button';
import { UsersPaginationProps } from '../types';

// Following existing pagination patterns from the system
export function UsersPagination({ pagination, onPageChange }: UsersPaginationProps) {
  // Safety check for pagination data
  if (!pagination) {
    return null;
  }

  const {
    page,
    limit,
    total,
    totalPages
  } = pagination;

  // Calculate pagination state
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Calculate the range of items being displayed
  const startItem = Math.max(1, (page - 1) * limit + 1);
  const endItem = Math.min(page * limit, total);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      const start = Math.max(1, page - Math.floor(maxVisiblePages / 2));
      const end = Math.min(totalPages, start + maxVisiblePages - 1);

      // Add first page if not included
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }

      // Add visible page range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add last page if not included
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Don't render pagination if there's only one page or no items
  if (totalPages <= 1 || total === 0) {
    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {total} {total === 1 ? 'user' : 'users'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      {/* Items count and info */}
      <div className="text-sm text-gray-700">
        Showing {startItem} to {endItem} of {total} users
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-2">
        {/* Previous button */}
        <Button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          variant="secondary"
          size="sm"
          className="px-3 py-2"
        >
          Previous
        </Button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((pageNum, index) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  pageNum === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            )
          ))}
        </div>

        {/* Next button */}
        <Button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          variant="secondary"
          size="sm"
          className="px-3 py-2"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
