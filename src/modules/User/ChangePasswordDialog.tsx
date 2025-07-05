import React, { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui";
import { PasswordInput } from "@/components/ui/password-input";
import { useMutation } from "@tanstack/react-query"; // Import useMutation
import { patch } from "@/services/apiService"; // Import the patch method
import { toast } from "sonner"; // Import toast for notifications
import Validate from "@/lib/Handlevalidation";

interface ChangePasswordDialogProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .min(1, "New Password is required"),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Mutation for changing the password
  const changePasswordMutation = useMutation({
    mutationFn: (password: string) =>
      patch(`/users/${userId}/password`, { password }),
    onSuccess: () => {
      toast.success("Password changed successfully!");
      onClose(); // Close the dialog after success
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to change password. Please try again."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords using Zod
    const result = passwordSchema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      // Get the first error message
      const errorMessage = result.error.errors[0]?.message;
      toast.error(errorMessage || "Validation failed");
      return;
    }

    // Trigger the mutation
    changePasswordMutation.mutate(newPassword);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <PasswordInput
              placeholder="New Password"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewPassword(e.target.value)
              }
              required
              className="w-full"
            />
            <PasswordInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              required
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={changePasswordMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending
                ? "Changing..."
                : "Change Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
