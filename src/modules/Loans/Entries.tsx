import React, { useState } from "react";
import { useLocation } from "react-router-dom";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  LoaderCircle,
  PlusCircle,
  ChevronUp,
  ChevronDown,
  Info,
} from "lucide-react";
import CustomPagination from "@/components/common/custom-pagination";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { get, post } from "@/services/apiService";
import { formatCurrency } from "@/lib/formatter";

// -------------------- TYPES --------------------
interface Entry {
  id: number;
  loanId: number;
  entryDate: string;
  balanceAmount: number;
  interestAmount: number;
  receivedDate?: string | null;
  receivedAmount?: number | null;
  receivedInterest?: number | null;
  loan?: { partyId: number };
}

interface PaginatedEntriesResponse {
  entries: Entry[];
  page: number;
  totalPages: number;
  totalEntries: number;
}

// -------------------- COMPONENT --------------------
const Entries = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const loanIdParam = searchParams.get("loanId");
  const partyIdParam = searchParams.get("partyId");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("entryDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const queryClient = useQueryClient();

  // Fetch entries
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<PaginatedEntriesResponse, any>({
    queryKey: [
      "entries",
      { page, limit, sortBy, sortOrder, loanIdParam, partyIdParam },
    ],
    queryFn: async () => {
      const params: Record<string, any> = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      if (loanIdParam) params.loanId = loanIdParam;
      // Backend currently only supports loanId filter.
      const res = await get("/entries", params);
      if (partyIdParam) {
        res.entries = res.entries.filter(
          (e: Entry) => e.loan?.partyId === Number(partyIdParam)
        );
      }
      return res;
    },
    keepPreviousData: true,
  });

  // -------------------- CREATE ENTRY MUTATION --------------------
  const createMutation = useMutation({
    mutationFn: (payload: Partial<Entry>) => post("/entries", payload),
    onSuccess: (data: any) => {
      if (data?.adjustments) {
        if (data.adjustments.interestAdjusted) {
          toast.info(
            `Interest amount was adjusted from ₹${data.adjustments.originalReceivedInterest} to ₹${data.adjustments.adjustedReceivedInterest}. Excess amount (₹${(data.adjustments.originalReceivedInterest - data.adjustments.adjustedReceivedInterest).toFixed(2)}) was added to received amount.`,
            { duration: 6000 }
          );
        }
        if (data.adjustments.amountAdjusted && !data.adjustments.interestAdjusted) {
          toast.info(
            `Received amount was adjusted from ₹${data.adjustments.originalReceivedAmount} to ₹${data.adjustments.adjustedReceivedAmount}.`,
            { duration: 4000 }
          );
        }
      }
      toast.success("Entry created successfully");
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      setShowCreateForm(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create entry");
    },
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // -------------------- RENDER --------------------
  return (
    <motion.div layout className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Entries</h1>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" /> {showCreateForm ? 'Hide Form' : 'Add Entry'}
        </Button>
      </div>

      {/* Create Entry Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            layout key="create-entry-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <span className="font-medium">Create Entry</span>
              </CardHeader>
              <CardContent>
                <CreateEntryForm
                  loanIdPrefill={loanIdParam ? Number(loanIdParam) : undefined}
                  onSubmit={(payload) => createMutation.mutate(payload)}
                  isSubmitting={createMutation.isLoading}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="font-medium">Entries List</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center text-destructive py-4">
              {error.message || "Failed to load entries"}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("entryDate")}
                    >
                      Entry Date
                      {sortBy === "entryDate" && (
                        <span className="inline-block ml-1">
                          {sortOrder === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </TableHead>
                    <TableHead>Balance Amount</TableHead>
                    <TableHead>Interest Amount</TableHead>
                    <TableHead>Received Amount</TableHead>
                    <TableHead>Received Interest</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.entries.length ? (
                    data.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(entry.balanceAmount)}</TableCell>
                        <TableCell>{formatCurrency(entry.interestAmount)}</TableCell>
                        <TableCell>{entry.receivedAmount ? formatCurrency(entry.receivedAmount) : "-"}</TableCell>
                        <TableCell>{entry.receivedInterest ? formatCurrency(entry.receivedInterest) : "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        No entries found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="mt-4">
                  <CustomPagination
                    page={page}
                    totalPages={data.totalPages}
                    onPageChange={(p) => setPage(p)}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

    </motion.div>
  );
};

// -------------------- CREATE ENTRY FORM --------------------
interface CreateEntryFormProps {
  loanIdPrefill?: number;
  onSubmit: (payload: any) => void;
  isSubmitting: boolean;
}

const CreateEntryForm = ({
  loanIdPrefill,
  onSubmit,
  isSubmitting,
}: CreateEntryFormProps) => {
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const [form, setForm] = useState({
    loanId: loanIdPrefill ?? "",
    entryDate: getTodayDate(),
    balanceAmount: "",
    balanceInterest: "",
    interestPercentage: "",
    interestAmount: "",
    totalPendingInterest: "",
    receivedDate: getTodayDate(),
    receivedAmount: "",
    receivedInterest: "",
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [baseReceivedAmount, setBaseReceivedAmount] = useState<number>(0);
  const [isInterestAdjusting, setIsInterestAdjusting] = useState<boolean>(false);
  const [isClosed, setIsClosed] = useState<boolean>(false);

  React.useEffect(() => {
    if (loanIdPrefill) {
      fetchLoanDetails(loanIdPrefill.toString());
    }
  }, [loanIdPrefill]);

  const fetchLoanDetails = async (loanId: string) => {
    if (!loanId || isNaN(Number(loanId))) return;
    try {
      const response = await get(`/entries/loan/${loanId}/details`);
      setForm((prev) => ({
        ...prev,
        balanceAmount: response.balanceAmount.toString(),
        balanceInterest: response.balanceInterest.toString(),
        interestPercentage: response.interest.toString(),
        interestAmount: response.calculatedInterestAmount.toString(),
        entryDate: response.nextEntryDate ? response.nextEntryDate.split('T')[0] : prev.entryDate,
        totalPendingInterest: response.totalPendingInterest.toString(),
      }));
      setValidationErrors({});
      setBaseReceivedAmount(0);
      setIsInterestAdjusting(false);
      setIsClosed(!!response.isClosed);
    } catch (error) {
      console.error('Failed to fetch loan details:', error);
      toast.error('Failed to fetch loan details');
    }
  };

  const validateAndAdjustAmounts = (updatedForm: typeof form, isInterestChange: boolean = false) => {
    const errors: { [key: string]: string } = {};
    const receivedInterest = parseFloat(updatedForm.receivedInterest || '0');
    const currentReceivedAmount = parseFloat(updatedForm.receivedAmount || '0');
    const totalPendingInterest = parseFloat(updatedForm.totalPendingInterest || '0');
    const balanceAmount = parseFloat(updatedForm.balanceAmount || '0');

    let adjustedReceivedAmount = currentReceivedAmount;
    let shouldUpdateReceivedAmount = false;

    if (isInterestChange) {
      if (receivedInterest > totalPendingInterest) {
        const excessInterest = receivedInterest - totalPendingInterest;
        adjustedReceivedAmount = baseReceivedAmount + excessInterest;
        shouldUpdateReceivedAmount = true;
        setIsInterestAdjusting(true);
        errors.receivedInterest = `Interest will be capped at ₹${totalPendingInterest.toFixed(2)}. Excess ₹${excessInterest.toFixed(2)} will be added to received amount.`;
      } else {
        adjustedReceivedAmount = baseReceivedAmount;
        shouldUpdateReceivedAmount = isInterestAdjusting;
        setIsInterestAdjusting(false);
      }
    }

    if (adjustedReceivedAmount > balanceAmount) {
      errors.receivedAmount = `Total received amount (₹${adjustedReceivedAmount.toFixed(2)}) cannot exceed balance amount (₹${balanceAmount.toFixed(2)}).`;
    }

    return { errors, adjustedReceivedAmount, shouldUpdateReceivedAmount };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);

    if (name === 'loanId' && value && !isNaN(Number(value))) {
      fetchLoanDetails(value);
    }

    if (name === 'receivedAmount') {
      const newAmount = parseFloat(value || '0');
      if (!isInterestAdjusting) {
        setBaseReceivedAmount(newAmount);
      }
      const validation = validateAndAdjustAmounts(updatedForm, false);
      setValidationErrors(validation.errors);
    }

    if (name === 'receivedInterest') {
      const validation = validateAndAdjustAmounts(updatedForm, true);
      setValidationErrors(validation.errors);
      if (validation.shouldUpdateReceivedAmount) {
        setForm(prev => ({
          ...prev,
          receivedAmount: validation.adjustedReceivedAmount.toString()
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {
      loanId: Number(form.loanId),
      entryDate: form.entryDate,
    };
    if (form.receivedDate) payload.receivedDate = form.receivedDate;
    if (form.receivedAmount) payload.receivedAmount = Number(form.receivedAmount);
    if (form.receivedInterest) payload.receivedInterest = Number(form.receivedInterest);
    onSubmit(payload);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {!loanIdPrefill && (
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="loanId">
            Loan ID <span className="text-red-500">*</span>
          </label>
          <Input
            id="loanId"
            name="loanId"
            type="number"
            value={form.loanId}
            onChange={handleChange}
            required
          />
        </div>
      )}

      {form.loanId && (
        <>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Loan Details</h3>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Next Entry Date</div>
                <div className="text-sm font-semibold text-gray-900">{formatDateForDisplay(form.entryDate)}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Current Balance Amount</label>
                <div className="py-2 px-1">
                  <span className="text-base font-semibold text-gray-900">₹{parseFloat(form.balanceAmount || '0').toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Interest Rate</label>
                <div className="py-2 px-1">
                  <span className="text-base font-semibold text-gray-900">{parseFloat(form.interestPercentage || '0').toFixed(2)}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Balance Interest</label>
                <div className="py-2 px-1">
                  <span className="text-base font-semibold text-gray-900">₹{parseFloat(form.balanceInterest || '0').toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  Interest Amount
                  <Dialog>
                    <DialogTrigger asChild>
                      <Info className="w-4 h-4 text-blue-600 cursor-pointer hover:text-blue-800 transition-colors" />
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Interest Calculation</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Interest on Balance</span>
                          <span className="font-semibold">₹{((parseFloat(form.balanceAmount || '0') * parseFloat(form.interestPercentage || '0')) / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">Current Balance Interest</span>
                          <span className="font-semibold">₹{parseFloat(form.balanceInterest || '0').toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-t-2 border-gray-300 font-semibold">
                          <span className="text-gray-800">Total Interest Amount</span>
                          <span className="text-lg text-blue-600">₹{parseFloat(form.totalPendingInterest || '0').toFixed(2)}</span>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </label>
                <div className="py-2 px-1 bg-blue-50 rounded">
                  <span className="text-base font-semibold text-blue-900">₹{parseFloat(form.totalPendingInterest || '0').toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!isClosed ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700" htmlFor="receivedDate">
                Received Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="receivedDate"
                name="receivedDate"
                type="date"
                value={form.receivedDate}
                onChange={handleChange}
                required
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700" htmlFor="receivedInterest">
                Received Interest <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-medium">₹</span>
                <Input
                  id="receivedInterest"
                  name="receivedInterest"
                  type="number"
                  step="0.01"
                  value={form.receivedInterest}
                  onChange={handleChange}
                  className={`pl-7 focus:ring-2 ${validationErrors.receivedInterest ? 'border-orange-500 focus:ring-orange-200' : 'focus:ring-blue-500'}`}
                  placeholder="0.00"
                  required
                />
              </div>
              {validationErrors.receivedInterest && (
                <p className="text-orange-600 text-xs mt-1 flex items-start gap-1">
                  <span className="text-orange-500 mt-0.5">ℹ</span>
                  {validationErrors.receivedInterest}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700" htmlFor="receivedAmount">
                Received Amount
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-medium">₹</span>
                <Input
                  id="receivedAmount"
                  name="receivedAmount"
                  type="number"
                  step="0.01"
                  value={form.receivedAmount}
                  onChange={handleChange}
                  className={`pl-7 focus:ring-2 ${validationErrors.receivedAmount ? 'border-red-500 focus:ring-red-200' : 'focus:ring-blue-500'}`}
                  placeholder="0.00"
                />
              </div>
              {validationErrors.receivedAmount && (
                <p className="text-red-500 text-xs mt-1 flex items-start gap-1">
                  <span className="text-red-500 mt-0.5">⚠</span>
                  {validationErrors.receivedAmount}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded border bg-red-50 text-red-700 text-sm">
          This loan account is closed. New payment entries are disabled.
        </div>
      )}

      <div className="flex justify-end items-center pt-4 border-t border-gray-200">
        {!isClosed && (
          <Button
            type="submit"
            disabled={isSubmitting || Object.keys(validationErrors).some(key => validationErrors[key] && validationErrors[key].includes('cannot exceed'))}
            className="px-6 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Create Entry
          </Button>
        )}
      </div>
    </form>
  );
};

export default Entries;




