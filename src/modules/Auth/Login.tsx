import { useEffect } from "react"; // Removed useState as it's not needed for isLoading
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { post } from "@/services/apiService";
import { appName, allowRegistration } from "@/config";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

// Type for API error response with field validation errors
interface ApiErrorResponse {
  errors?: Array<{
    path: Array<string | number>;
    message: string;
  }>;
  status?: number;
  data?: any;
  message?: string;
}
// Define expected API response structure for SUCCESS
interface LoginResponse {
  token: string;
  accesstoken: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    active: boolean;
    lastLogin: string;
    member?: {
      id: number;
      memberName: string;
      // Other member fields as needed
    };
    isMember: boolean;
  };
}

type LoginFormInputs = z.infer<typeof loginSchema>;

const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),

  password: z.string().min(1, "Password is required"),
});

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get setError from useForm
  const {
    register,
    handleSubmit,
    setError, // <-- Destructure setError
    formState: { errors },
    // getValues // Can be useful for debugging
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (location.state?.unauthorized) {
      toast.error("You are not authorized.");
      setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} });
      }, 0);
    }
  }, [location, navigate]);

  const loginMutation = useMutation<
    LoginResponse,
    any, // Changed to 'any' to access enhanced error properties
    LoginFormInputs
  >({
    mutationFn: async (loginData: LoginFormInputs) => {
      return await post("/auth/login", loginData);
    },
    onSuccess: (data) => {
      console.log("Login successful:", data);
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("refreshToken", data.accesstoken);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Store memberId from the nested structure if it exists
      if (data.user.member && data.user.member.id) {
        localStorage.setItem("memberId", data.user.member.id.toString());
      }
      
      // queryClient.invalidateQueries(...) // Consider invalidating relevant queries
      navigate("/loans");
      toast.success("Login successful!");
    },
    onError: (error: ApiErrorResponse) => {
      // Handle field-specific validation errors (map to form fields)
      const handleValidationErrors = () => {
        // Check if we have field-specific errors to map to the form
        if (error.errors && Array.isArray(error.errors)) {
          error.errors.forEach((fieldError) => {
            // Only process if we have a path and message
            if (fieldError.path && fieldError.message && Array.isArray(fieldError.path)) {
              // Get the field name (last item in the path array or the first item if single-level)
              const fieldName = fieldError.path[fieldError.path.length - 1] || fieldError.path[0];
              
              // Set the error on the specific field if it matches our form fields
              if (typeof fieldName === 'string' && (fieldName === 'email' || fieldName === 'password')) {
                setError(fieldName as keyof LoginFormInputs, {
                  type: 'server',
                  message: fieldError.message
                });
              }
            }
          });
          return true; // We handled field-specific errors
        }
        return false; // No field-specific errors to handle
      };
      
      // First try to handle field-specific validation errors
      const hadFieldErrors = handleValidationErrors();
      
      // If we didn't have field-specific errors OR we want to show both field and general errors
      if (!hadFieldErrors || error.status === 401) {
        // Use our improved error message from apiService
        toast.error(error.message || "An error occurred during login.");
      }
      
      // Log detailed error information for debugging
      console.error("Login error details:", error);
    },
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = (data) => {
    // Optionally log data being sent: console.log("Submitting:", data);
    loginMutation.mutate(data);
  };

  const isLoading = loginMutation.isPending;

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Login to your account</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your {appName} account
            </p>
          </div>

        {/* Email Field */}
        <div className="grid gap-2 relative pb-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email")}
            required
            disabled={isLoading}
            aria-invalid={errors.email ? "true" : "false"}
          />
          {errors.email && (
            <p className="text-destructive text-xs absolute -bottom-1 left-0">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="grid gap-2 relative pb-3">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            {...register("password")}
            required
            disabled={isLoading}
            aria-invalid={errors.password ? "true" : "false"}
          />
          {errors.password && (
            <p className="text-destructive text-xs absolute -bottom-1 left-0">
              {errors.password.message}
            </p>
          )}
           <a
              href="/forgot-password"
              tabIndex={isLoading ? -1 : 0}
              className="ml-auto text-sm underline-offset-2 hover:underline text-muted-foreground hover:text-foreground"
            >
              Forgot your password?
            </a>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>

        {/* Registration Link */}
        {allowRegistration && (
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/register" className="underline underline-offset-4 text-primary hover:text-primary/80">
              Sign up
            </a>
          </div>
        )}
      </div>
    </form>
    </div>
  );
};

export default Login;
