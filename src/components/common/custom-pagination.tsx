import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // Optional props for enhanced pagination (UserList style)
  totalRecords?: number;
  recordsPerPage?: number;
  onRecordsPerPageChange?: (newRecordsPerPage: number) => void;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords,
  recordsPerPage,
  onRecordsPerPageChange,
}) => {
  // Show pagination even with 1 page for debugging
  const actualTotalPages = totalPages || 1;

  // Always show pagination for debugging - comment out the return null
  // if (actualTotalPages <= 1) {
  //   return null;
  // }
  
 
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:w-full gap-4 mt-4 sm:relative">
      {/* Records per page selector (only show if callback provided) */}
      {onRecordsPerPageChange && recordsPerPage && (
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <select
            className="border rounded p-1 text-sm bg-background"
            value={recordsPerPage}
            onChange={(e) => onRecordsPerPageChange(Number(e.target.value))}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span className="text-sm">per page</span>
        </div>
      )}
      
      {/* Navigation buttons */}
      <div className="flex items-center gap-2 mx-auto sm:mx-0 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <span className="text-sm font-medium px-3">
          {currentPage}/{actualTotalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= actualTotalPages}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Total records info (only show if totalRecords provided) */}
      {totalRecords !== undefined && recordsPerPage && (
        <div className="text-sm text-muted-foreground ml-auto">
          Showing {(currentPage - 1) * recordsPerPage + 1} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords}
        </div>
      )}
    </div>
  );
};

export default CustomPagination;
