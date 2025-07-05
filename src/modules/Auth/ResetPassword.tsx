import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useNavigate, useParams } from "react-router-dom"; // Import useParams
import { post } from "@/services/apiService";
import { LoaderCircle } from "lucide-react"; // Import the spinner icon
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import Validate from "@/lib/Handlevalidation";

// Define expected API response structure
interface ResetPasswordResponse {
  message: string;
}

interface ResetPasswordRequest {
  password: string;
  token: string;
}

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .min(1, "Password is required"),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormInputs = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const {
    register,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormInputs>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const navigate = useNavigate();
  const { token } = useParams();

  const resetPasswordMutation = useMutation<
    ResetPasswordResponse,
    unknown,
    ResetPasswordRequest
  >({
    mutationFn: (data) =>
      post(`/auth/reset-password/${token}`, { password: data.password }),
    onSuccess: () => {
      toast.success("Password reset successful!");
      navigate("/");
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    },
  });

  const onSubmit: SubmitHandler<ResetPasswordFormInputs> = (data) => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    resetPasswordMutation.mutate({
      password: data.password,
    });
  };

  return (
    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-balance text-muted-foreground">
            Enter your new password to reset your account
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">New Password</Label>
          <PasswordInput
            id="password"
            type="password"
            placeholder="Enter new password"
            {...register("password")}
            required
            disabled={resetPasswordMutation.isPending}
          />
          {errors.password && (
            <span className="text-red-500">{errors.password.message}</span>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordInput
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            {...register("confirmPassword")}
            required
            disabled={resetPasswordMutation.isPending}
          />
          {errors.confirmPassword && (
            <span className="text-red-500">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </div>
    </form>
  );
};

export default ResetPassword;
