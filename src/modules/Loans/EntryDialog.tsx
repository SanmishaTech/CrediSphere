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
    onSuccess: () => {
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
    } catch (error) {
      console.error('Failed to fetch loan details:', error);
      toast.error('Failed to fetch loan details');
    } finally {
      setIsLoadingLoanDetails(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'loanId' && value && !isNaN(Number(value))) {
      fetchLoanDetails(value);
    }
  };

  const calculateInterestAmount = (balance: string, percentage: string) => {
    const balanceNum = parseFloat(balance) || 0;
    const percentageNum = parseFloat(percentage) || 0;
    return ((balanceNum * percentageNum) / 100).toString();
  };

  const handleBalanceOrPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };

    if (name === 'balanceAmount' || name === 'interestPercentage') {
      const newBalance = name === 'balanceAmount' ? value : form.balanceAmount;
      const newPercentage = name === 'interestPercentage' ? value : form.interestPercentage;
      updatedForm.interestAmount = calculateInterestAmount(newBalance, newPercentage);
    }

    setForm(updatedForm);
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
    <form className="space-y-4" onSubmit={handleSubmit}>
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

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="entryDate">
            Next Entry Date <span className="text-red-500">*</span>
          </label>
          <Input
            id="entryDate"
            name="entryDate"
            type="date"
            value={form.entryDate}
            onChange={handleChange}
            required
            disabled
          />
        </div>
      </div>

      {form.loanId && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="balanceAmount">
                Current Balance Amount
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                <Input
                  id="balanceAmount"
                  name="balanceAmount"
                  type="number"
                  step="0.01"
                  value={form.balanceAmount}
                  onChange={handleBalanceOrPercentageChange}
                  className="pl-7 bg-gray-100 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="interestPercentage">
                Interest Rate %
              </label>
              <Input
                id="interestPercentage"
                name="interestPercentage"
                type="number"
                step="0.01"
                value={form.interestPercentage}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="balanceInterest">
                Balance Interest
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                <Input
                  id="balanceInterest"
                  name="balanceInterest"
                  type="number"
                  step="0.01"
                  value={form.balanceInterest}
                  disabled
                  className="pl-7 bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1" htmlFor="interestAmount">
                Interest Amount
                <Dialog>
                  <DialogTrigger asChild>
                    <Info className="w-4 h-4 text-blue-600 cursor-pointer" />
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Interest Calculation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Interest on Balance</span>
                        <span className="font-semibold">{((parseFloat(form.balanceAmount || '0') * parseFloat(form.interestPercentage || '0')) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Balance Interest</span>
                        <span className="font-semibold">{parseFloat(form.balanceInterest || '0').toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2 font-semibold">
                        <span>New Interest Amount</span>
                        <span className="text-lg">{parseFloat(form.totalPendingInterest || '0').toFixed(2)}</span>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                <Input
                  id="interestAmount"
                  name="interestAmount"
                  type="number"
                  step="0.01"
                  value={form.totalPendingInterest}
                  disabled
                  className="pl-7 bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>
          </div>


        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="receivedDate">
            Received Date
          </label>
          <Input
            id="receivedDate"
            name="receivedDate"
            type="date"
            value={form.receivedDate}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="receivedAmount">
            Received Amount
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
            <Input
              id="receivedAmount"
              name="receivedAmount"
              type="number"
              step="0.01"
              value={form.receivedAmount}
              onChange={handleChange}
              className="pl-7"
            />
          </div>
        </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="receivedInterest">
          Received Interest
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
          <Input
            id="receivedInterest"
            name="receivedInterest"
            type="number"
            step="0.01"
            value={form.receivedInterest}
            onChange={handleChange}
            className="pl-7"
          />
        </div>
      </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Create Entry
        </Button>
      </div>
    </form>
  );
};

export default EntryDialog;

