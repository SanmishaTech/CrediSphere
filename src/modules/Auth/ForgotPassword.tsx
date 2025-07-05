import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { post } from "@/services/apiService";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import Validate from "@/lib/Handlevalidation";
// Define expected API response structure
interface ForgotPasswordResponse {
  message: string;
}

interface ForgotPasswordRequest {
  email: string;
  resetUrl: string;
}

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
});

type ForgotPasswordFormInputs = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFormInputs>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPasswordMutation = useMutation<
    ForgotPasswordResponse,
    unknown,
    ForgotPasswordRequest
  >({
    mutationFn: (data) => post("/auth/forgot-password", data),
    onSuccess: () => {
      toast.success(
        "Password reset instructions have been sent to your email."
      );
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

  const onSubmit: SubmitHandler<ForgotPasswordFormInputs> = (data) => {
    const resetUrl = `${window.location.origin}/reset-password`;
    forgotPasswordMutation.mutate({ ...data, resetUrl });
  };

  return (
    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-balance text-muted-foreground">
            Enter your email address to reset your password
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email")}
            required
            disabled={forgotPasswordMutation.isPending}
          />
          {errors.email && (
            <span className="text-red-500">{errors.email.message}</span>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={forgotPasswordMutation.isPending}
        >
          {forgotPasswordMutation.isPending ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
        <div className="text-center text-sm">
          Remember your password?{" "}
          <a href="/" className="underline underline-offset-4">
            Login
          </a>
        </div>
      </div>
    </form>
  );
};

export default ForgotPassword;
