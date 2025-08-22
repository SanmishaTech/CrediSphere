import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, addMonths, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/formatter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  LoaderCircle,
  PenSquare,
  Search,
  Trash2,
  PlusCircle,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CustomPagination from "@/components/common/custom-pagination";
import { get, del, post } from "@/services/apiService";
import { format as formatDate } from "date-fns";
// Import components from current directory
import CreateLoan from "./CreateLoan";
import EditLoan from "./EditLoan";
import EntryDialog from "./EntryDialog";

interface Loan {
  id: number;
  loanDate: string;
  loanAmount: number;
  balanceAmount: number;
  interest: number;
  balanceInterest: number;
  partyName: string;
  accountNumber: string;
  isClosed?: boolean;
  closedAt?: string | null;
  closedAmount?: number | null;
  party?: {
    partyName: string;
    accountNumber: string;
    mobile1: string;
    address: string;
  };
}

interface MonthlyData {
  loanAmount: number;
  receivedAmount: number;
  receivedInterest: number;
  /** Remaining interest for the month */
  totalPendingInterest?: number;
  /** Optional, older field name */
  balanceInterest?: number;
  receivedDate: string | null;
}

interface TableRowData {
  id: number;
  loanDate: string;
  partyName: string;
  party?: {
    partyName: string;
    accountNumber: string;
    mobile1: string;
    address: string;
  };
  monthlyAmounts?: Record<string, number>; // Fallback for old structure
  monthlyReceivedAmounts?: Record<string, number>; // Fallback for old structure
  monthlyData?: Record<string, MonthlyData>; // New detailed structure
  totalLoanAmount: number;
  totalBalanceInterest: number;
  totalReceivedAmount?: number;
  totalReceivedInterest?: number;
  interest: number;
  balanceAmount?: number;
  isClosed?: boolean;
}

interface LoansResponse {
  loans: Loan[];
  totalPages: number;
  totalLoans: number;
}

const LoanList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortBy] = useState("loanDate");
  const [sortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [editLoanId, setEditLoanId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [selectedLoanIsClosed, setSelectedLoanIsClosed] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonths = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, -3));
  };

  const handleNextMonths = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 3));
  };

  // Fetch loans for table display
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<LoansResponse>({
    queryKey: ["loans", currentPage, recordsPerPage, search, sortBy, sortOrder],
    queryFn: () => {
       return get("/loans", { page: currentPage, limit: recordsPerPage, search, sortBy, sortOrder });
    },
  });

  // Fetch monthly summary for displaying monthly amounts
  const {
    data: monthlySummaryData,
    isLoading: isLoadingMonthlySummary,
  } = useQuery({
    queryKey: ["loans", "monthly-summary", currentDate],
    queryFn: () => {
      const startDate = new Date(currentDate.getFullYear(), 0, 1).toISOString();
      const endDate = new Date(currentDate.getFullYear(), 11, 31).toISOString();
      return get("/loans/monthly-summary", { startDate, endDate });
    },
  });

  // Delete loan mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/loans/${id}`),
    onSuccess: () => {
      toast.success("Loan deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (error: any) => {
      toast.error(error.errors?.message || error.message || "Failed to delete loan");
    },
  });


  // Fetch latest day close info
  const {
    data: lastCloseData,
  } = useQuery({
    queryKey: ["lastDayClose"],
    queryFn: () => get("/api/day-closes/last"),
  });

  // Day Close mutation
  const dayCloseMutation = useMutation({
    mutationFn: () => post("/api/day-closes", {}),
    onSuccess: (data: any) => {
      const nextDayFormatted = data.nextDay ? formatDate(new Date(data.nextDay), "dd MMM yyyy") : "";
      toast.success(`Day closed. Next day: ${nextDayFormatted}`);
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["lastDayClose"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || "Failed to perform day close");
    },
  });

  const handleDayClose = () => {
    dayCloseMutation.mutate();
  };


  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (!data || newPage <= data.totalPages)) {
      setCurrentPage(newPage);
    }
  };

  // Handle records per page change
  const handleRecordsPerPageChange = (newLimit: number) => {
    setRecordsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when limit changes
  };

  // Handle edit loan
  const handleEdit = (id: string) => {
    setEditLoanId(id);
    setIsEditDialogOpen(true);
  };

  // Handle dialog close
  const handleCreateDialogClose = () => {
    setIsCreateDialogOpen(false);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditLoanId(null);
  };

  const { tableData, months } = useMemo(() => {
    // Prepare 3-month window header starting from currentDate
    const visibleMonths: string[] = [];
    for (let i = 0; i < 3; i++) {
      visibleMonths.push(format(addMonths(currentDate, i), "MMMM yyyy"));
    }

    // If we don't have any loans, bail out early
    if (!data?.loans || data.loans.length === 0) {
      return { tableData: [], months: visibleMonths };
    }

    // Build a map of loanId → monthly summary for quick lookup
    const summaryMap = new Map<number, any>();
    if (monthlySummaryData && Array.isArray((monthlySummaryData as any).summary)) {
      (monthlySummaryData as any).summary.forEach((item: any) => {
        summaryMap.set(item.loanId, item);
      });
    }

    // Convert each loan into the table row expected by the UI
    const tableData = data.loans.map((loan) => {
      const monthOfLoan = format(parseISO(loan.loanDate), "MMMM yyyy");
      const summary = summaryMap.get(loan.id);

      return {
        id: loan.id,
        loanDate: loan.loanDate,
        partyName: loan.party?.partyName || loan.partyName,
        party: loan.party,

        // Old structure – retain for backwards compatibility / fallback
        monthlyAmounts: {
          [monthOfLoan]: loan.loanAmount,
        },

        // New structure coming from /loans/monthly-summary
        monthlyData: summary?.monthlyData ?? {},
        monthlyReceivedAmounts: summary?.monthlyReceivedAmounts ?? {},
        totalLoanAmount: summary?.totalLoanAmount ?? loan.loanAmount,
        totalReceivedAmount: summary?.totalReceivedAmount ?? 0,
        totalReceivedInterest: summary?.totalReceivedInterest ?? 0,
        totalBalanceInterest: loan.balanceInterest,
        balanceAmount: loan.balanceAmount,
        interest: loan.interest,
        isClosed: loan.isClosed,
      } as TableRowData;
    });

    return { tableData, months: visibleMonths };
  }, [data, currentDate, monthlySummaryData]);



  // Handle error loan
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Loans</h2>
        <p>{(error as any)?.message || "Failed to load loans"}</p>
        <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["loans"] })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      
      
      
      <Card className="border border-border">
        <CardHeader className="text-xl font-bold">
          <div className="flex items-center justify-between gap-4">
            <div>
              Loans
              <CardDescription>
                Manage loans
              </CardDescription>
            </div>
            {/* Right group: search with latest close under it (desktop) */}
            <div className="hidden min-[765px]:flex flex-col items-end gap-1">
              <div className="relative w-[22rem] max-w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
              </div>
              {lastCloseData?.lastClose && (
                <div className="text-xs text-muted-foreground">
                  Latest close: {formatDate(new Date(lastCloseData.lastClose.closedAt), "dd MMM yyyy, hh:mm a")} 
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      
        <CardContent>
       
          {/* Toolbar */}
          <div className="flex flex-col gap-4 mb-4 min-[765px]:grid min-[765px]:grid-cols-3 min-[765px]:items-center">
            {/* Search Input (below 765px) */}
            <div className="relative w-full flex-1 min-w-[200px] min-[765px]:invisible">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9 w-full md:w-72"
              />
              {lastCloseData?.lastClose && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Latest close: {formatDate(new Date(lastCloseData.lastClose.closedAt), "dd MMM yyyy, hh:mm a")} 
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 min-[765px]:gap-5 min-[765px]:mb-0 min-[765px]:justify-self-center">
            <Button onClick={handlePrevMonths} variant="outline">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            <span className="text-xs md:text-sm font-medium text-center whitespace-nowrap">
              {format(currentDate, "MMM yyyy")} - {format(addMonths(currentDate, 2), "MMM yyyy")}
            </span>
            <Button onClick={handleNextMonths} variant="outline">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

<div className="flex justify-end min-[765px]:justify-self-end gap-2">
            {/* Day Close Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={dayCloseMutation.isPending}>
                  {dayCloseMutation.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  Dayclose
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will perform the day close operation for the current month. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDayClose}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Action Buttons */}
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
          </div>

 
          {/* Loans Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 divide-x divide-border">
                  <TableHead className="text-center">Account Number</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead className="text-center">Loan(Interest)</TableHead>
                  {months.map((month: string) => (
                    <TableHead key={month} className="text-center">{month}</TableHead>
                  ))}
                  <TableHead className="text-center border-r border-gray-300 p-2 md:p-3 text-xs md:text-sm">Remaining Interest</TableHead>
                  <TableHead className="text-center border-r border-gray-300 p-2 md:p-3 text-xs md:text-sm">Balance Pending</TableHead>
                  <TableHead className="text-center p-2 md:p-3 text-xs md:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoading || isLoadingMonthlySummary) ? (
                  <TableRow className="border-b border-gray-300">
                    <TableCell colSpan={months.length + 7} className="text-center">
                      <LoaderCircle className="h-8 w-8 animate-spin inline-block" />
                    </TableCell>
                  </TableRow>
                ) : tableData.length === 0 ? (
                  <TableRow className="border-b border-gray-300">
                    <TableCell colSpan={months.length + 7} className="text-center">
                      No loans found.
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map(row => (
                    <TableRow 
                      key={row.id} 
                      className={`cursor-pointer divide-x divide-border ${row.isClosed ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-muted/50'}`} 
                      onClick={() => {
                        setSelectedLoanId(row.id);
                        setSelectedLoanIsClosed(!!row.isClosed);
                        setIsEntryDialogOpen(true);
                      }}
                    >
                        <TableCell className="text-center">
                        {row.party?.accountNumber}
                      </TableCell>
                      <TableCell className="text-center">
                        {format(parseISO(row.loanDate), "dd/MM/yyyy")}
                      </TableCell>
                    
                       <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{row.partyName}</span>
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">{row.party?.mobile1}</span>
                            <span className="text-sm text-muted-foreground">{row.party?.address}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-base md:text-lg tabular-nums">{formatCurrency(row.totalLoanAmount)}</span>{" "}
                        <span className="text-sm text-muted-foreground">
                          ({row.interest}%)
                        </span>
                      </TableCell>
                       {months.map(month => {
                        const monthData = row.monthlyData?.[month];
                        const hasData = monthData && (
                          monthData.loanAmount > 0 || 
                          monthData.receivedAmount > 0 || 
                          monthData.receivedInterest > 0 ||
                          monthData.receivedDate
                        );
                        
                        // Fallback to old structure if new structure not available
                        const fallbackReceivedAmount = row.monthlyReceivedAmounts?.[month];
                        
                        return (
                          <TableCell key={month} className="text-center">
                            <div className="flex flex-col gap-1 text-sm md:text-base">
                              {/* Always show interest amount */}
                              <div className="text-gray-700 font-semibold text-base md:text-lg tabular-nums">
                                 {formatCurrency((row.totalLoanAmount * row.interest) / 100)}
                              </div>
                              
                              {/* Show paid amount if available */}
                              <div className="text-blue-600 font-semibold text-sm md:text-base tabular-nums">
                                 {hasData && monthData.receivedInterest > 0 
                                   ? `${formatCurrency(monthData.receivedInterest)}` 
                                   : fallbackReceivedAmount 
                                     ? `${formatCurrency(fallbackReceivedAmount)}` 
                                     : "-"}
                              </div>
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center border-r border-gray-300 p-2 md:p-3 text-sm md:text-lg font-semibold tabular-nums">
                        {formatCurrency(row.totalBalanceInterest)}
                      </TableCell>
                      <TableCell className="text-center border-r border-gray-300 p-2 md:p-3 text-sm md:text-lg font-semibold tabular-nums">
                        {formatCurrency(row.balanceAmount ?? 0)}
                      </TableCell>
                      <TableCell className="text-center p-2 md:p-3">
                        <div className="flex justify-center gap-1 md:gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/entries?loanId=${row.id}`)}
                            title="Entries"
                          >
                            <List className="h-4 w-4" />
                            <span className="sr-only">Entries</span>
                          </Button>
                          {!row.isClosed && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(row.id.toString())}
                            >
                              <PenSquare className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this loan? <strong>All entries linked to this loan will be deleted as well.</strong> This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(row.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  {deleteMutation.isPending ? (
                                    <>
                                      <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-4">
            <CustomPagination
              currentPage={currentPage}
              totalPages={data?.totalPages || 1}
              totalRecords={data?.totalLoans || 0}
              recordsPerPage={recordsPerPage}
              onPageChange={handlePageChange}
              onRecordsPerPageChange={handleRecordsPerPageChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Loan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Loan</DialogTitle>
          </DialogHeader>
          <CreateLoan onSuccess={handleCreateDialogClose} />
        </DialogContent>
      </Dialog>

      {/* Edit Loan Dialog */}
      {editLoanId && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Loan</DialogTitle>
            </DialogHeader>
            <EditLoan loanId={editLoanId} onSuccess={handleEditDialogClose} />
          </DialogContent>
        </Dialog>
      )}

      {/* Entry Creation Dialog */}
      <EntryDialog
        selectedLoanId={selectedLoanId}
        selectedLoanIsClosed={selectedLoanIsClosed}
        isEntryDialogOpen={isEntryDialogOpen}
        setIsEntryDialogOpen={setIsEntryDialogOpen}
        setSelectedLoanId={setSelectedLoanId}
      />
    </div>
  );
};


export default LoanList;
