import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle, XCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { post } from "@/services/apiService";
import { toast } from "sonner";

interface CloseAccountDialogProps {
  loanId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CloseAccountDialog: React.FC<CloseAccountDialogProps> = ({
  loanId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [totalAmountGiven, setTotalAmountGiven] = useState("");

  const closeAccountMutation = useMutation({
    mutationFn: (payload: { loanId: number; totalAmountGiven: number }) =>
      post("/loans/close-account", payload),
    onSuccess: () => {
      toast.success("Account closed successfully");
      setTotalAmountGiven("");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to close account");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!totalAmountGiven || parseFloat(totalAmountGiven) < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    closeAccountMutation.mutate({
      loanId,
      totalAmountGiven: parseFloat(totalAmountGiven),
    });
  };

  const handleClose = () => {
    setTotalAmountGiven("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Close Account
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This action will permanently close loan account #{loanId}. 
              Please enter the final settlement amount.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalAmountGiven">
              Total Amount Given <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-medium">
                ₹
              </span>
              <Input
                id="totalAmountGiven"
                type="number"
                step="0.01"
                value={totalAmountGiven}
                onChange={(e) => setTotalAmountGiven(e.target.value)}
                className="pl-7"
                placeholder="0.00"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This action cannot be undone. 
              The account will be marked as closed and removed from active loans.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={closeAccountMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={closeAccountMutation.isPending || !totalAmountGiven}
            >
              {closeAccountMutation.isPending && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              Close Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CloseAccountDialog;
