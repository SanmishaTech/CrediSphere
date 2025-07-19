import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle, Info } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, get } from "@/services/apiService";

interface EntryDialogProps {
  selectedLoanId: number | null;
  isEntryDialogOpen: boolean;
  setIsEntryDialogOpen: (open: boolean) => void;
  setSelectedLoanId: (id: number | null) => void;
}

interface CreateEntryFormProps {
  loanIdPrefill?: number;
  onSubmit: (payload: any) => void;
  isSubmitting: boolean;
  onCancel?: () => void;
}

const EntryDialog: React.FC<EntryDialogProps> = ({
  selectedLoanId,
  isEntryDialogOpen,
  setIsEntryDialogOpen,
  setSelectedLoanId,
}) => {
  const queryClient = useQueryClient();
  const createEntryMutation = useMutation({
    mutationFn: (payload: any) => post("/entries", payload),
    onSuccess: (data) => {
      // Check if any adjustments were made and show appropriate messages
      if (data.adjustments) {
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
      setIsEntryDialogOpen(false);
      setSelectedLoanId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create entry");
    },
  });

  return (
    selectedLoanId && (
      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Entry for Loan #{selectedLoanId}</DialogTitle>
          </DialogHeader>
          <CreateEntryForm
            loanIdPrefill={selectedLoanId}
            onSubmit={(payload) => createEntryMutation.mutate(payload)}
            isSubmitting={createEntryMutation.isPending}
            onCancel={() => {
              setIsEntryDialogOpen(false);
              setSelectedLoanId(null);
            }}
          />
        </DialogContent>
      </Dialog>
    )
  );
};

const CreateEntryForm: React.FC<CreateEntryFormProps> = ({
  loanIdPrefill,
  onSubmit,
  isSubmitting,
  onCancel,
}) => {
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
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

  const [isLoadingLoanDetails, setIsLoadingLoanDetails] = useState(false);

  React.useEffect(() => {
    if (loanIdPrefill) {
      fetchLoanDetails(loanIdPrefill.toString());
    }
  }, [loanIdPrefill]);

  const fetchLoanDetails = async (loanId: string) => {
    if (!loanId || isNaN(Number(loanId))) return;

    setIsLoadingLoanDetails(true);
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
      // Clear validation errors and reset adjustment state when new loan details are loaded
      setValidationErrors({});
      setBaseReceivedAmount(0);
      setIsInterestAdjusting(false);
    } catch (error) {
      console.error('Failed to fetch loan details:', error);
      toast.error('Failed to fetch loan details');
    } finally {
      setIsLoadingLoanDetails(false);
    }
  };

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [baseReceivedAmount, setBaseReceivedAmount] = useState<number>(0); // Track the original amount entered by user
  const [isInterestAdjusting, setIsInterestAdjusting] = useState<boolean>(false); // Track if we're in adjustment mode

  const validateAndAdjustAmounts = (updatedForm: typeof form, isInterestChange: boolean = false) => {
    const errors: {[key: string]: string} = {};
    
    const receivedInterest = parseFloat(updatedForm.receivedInterest || '0');
    const currentReceivedAmount = parseFloat(updatedForm.receivedAmount || '0');
    const totalPendingInterest = parseFloat(updatedForm.totalPendingInterest || '0');
    const balanceAmount = parseFloat(updatedForm.balanceAmount || '0');
    
    let adjustedReceivedAmount = currentReceivedAmount;
    let shouldUpdateReceivedAmount = false;
    
    // If this is an interest change, calculate the adjustment
    if (isInterestChange) {
      if (receivedInterest > totalPendingInterest) {
        // Interest exceeds limit - cap it and add excess to received amount
        const excessInterest = receivedInterest - totalPendingInterest;
        adjustedReceivedAmount = baseReceivedAmount + excessInterest;
        shouldUpdateReceivedAmount = true;
        setIsInterestAdjusting(true);
        
        errors.receivedInterest = `Interest will be capped at ₹${totalPendingInterest.toFixed(2)}. Excess ₹${excessInterest.toFixed(2)} will be added to received amount.`;
      } else {
        // Interest is within limit - use base amount
        adjustedReceivedAmount = baseReceivedAmount;
        shouldUpdateReceivedAmount = isInterestAdjusting; // Only update if we were previously adjusting
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
    
    // Handle received amount changes - track the base amount
    if (name === 'receivedAmount') {
      const newAmount = parseFloat(value || '0');
      // Only update base amount if we're not currently in adjustment mode
      if (!isInterestAdjusting) {
        setBaseReceivedAmount(newAmount);
      }
      
      const validation = validateAndAdjustAmounts(updatedForm, false);
      setValidationErrors(validation.errors);
    }
    
    // Handle received interest changes - adjust amount if needed
    if (name === 'receivedInterest') {
      const validation = validateAndAdjustAmounts(updatedForm, true);
      setValidationErrors(validation.errors);
      
      // Update received amount if adjustment is needed
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
          {/* Loan Details Section */}
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

      {/* Payment Section */}
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

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="px-6">
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting || Object.keys(validationErrors).some(key => validationErrors[key] && validationErrors[key].includes('cannot exceed'))}
          className="px-6 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
        >
          {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Create Entry
        </Button>
      </div>
    </form>
  );
};

export default EntryDialog;

