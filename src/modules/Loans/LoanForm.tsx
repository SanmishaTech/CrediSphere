import { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoaderCircle, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { post, put, get } from "@/services/apiService";
import Validate from "@/lib/Handlevalidation";

// Helper to extract user-friendly message from API error
const prettifyFieldName = (key: string): string => {
  // Remove table prefix and suffix if present
  const parts = key.split("_");
  let field = parts.length > 1 ? parts[1] : key;
  // Remove trailing 'key' or 'id'
  field = field.replace(/(key|id)$/i, "");
  // Convert camelCase to spaced words
  field = field.replace(/([A-Z])/g, " $1").trim();
  // Capitalize first letter
  return field.charAt(0).toUpperCase() + field.slice(1);
};

const extractErrorMessage = (error: any): string | undefined => {
  if (error?.errors && typeof error.errors === "object") {
    const firstKey = Object.keys(error.errors)[0];
    if (firstKey) {
      const message = error.errors[firstKey]?.message as string | undefined;
      if (message) {
        const pretty = prettifyFieldName(firstKey);
        return message.replace(firstKey, pretty);
      }
    }
  }
  return error?.message;
};

// Define interfaces for API responses
interface LoanData {
  partyId: number;
  id: number;
  loanDate: string;
  loanAmount: number;
  balanceAmount: number;
  interest: number;
  interestPerMonth?: number;
  balanceInterest: number;
  referenceMobile1: string;
  referenceMobile2: string;
  createdAt: string;
  updatedAt: string;
}

const loanFormSchema = z.object({
  partyId: z.string().optional(),
  loanDate: z.string()
    .nonempty("Loan date is required"),
    loanAmount: z.string()
    .nonempty("Loan amount is required"),
    balanceAmount: z.string().optional(),
    interestPerMonth: z.string().optional(),
    interest: z.string()
    .nonempty("Interest is required"),
    balanceInterest: z.string().optional(),
    // Party fields for create party option
    partyName: z.string().optional(),
    accountNumber: z.string().optional(),
    address: z.string().optional(),
    mobile1: z.string().optional(),
    reference: z.string().optional(),
    referenceMobile1: z.string().optional(),
});

type LoanFormInputs = z.infer<typeof loanFormSchema>;

interface LoanFormProps {
  mode: "create" | "edit";
  loanId?: string;
  onSuccess?: () => void;
  className?: string;
}

const LoanForm = ({
  mode,
  loanId,
  onSuccess,
  className,
}: LoanFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Combined loading loan from fetch and mutations

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<LoanFormInputs>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      partyId: "",
      loanDate: mode === "create" ? new Date().toISOString().split("T")[0] : "",
      loanAmount: "",
      balanceAmount: "",
      interestPerMonth: "",
      interest: "",
      balanceInterest: "0",
      // Party fields
      partyName: "",
      accountNumber: "",
      address: "",
      mobile1: "",
      reference: "",
      referenceMobile1: "",
    },
  });

  // Watch loan amount and interest to auto-populate balance amount and interest per month
  const loanAmount = watch("loanAmount");
  const interest = watch("interest");
   
  // Auto-populate balance amount when loan amount changes (only in create mode)
  useEffect(() => {
    if (mode === "create" && loanAmount) {
      setValue("balanceAmount", loanAmount);
    }
  }, [loanAmount, setValue, mode]);

  // Auto-calculate interest per month when loan amount or interest percentage changes
  useEffect(() => {
    if (loanAmount && interest) {
      const loanAmountNum = parseFloat(loanAmount) || 0;
      const interestNum = parseFloat(interest) || 0;
      const interestPerMonth = ((loanAmountNum * interestNum) / 100).toString();
      setValue("interestPerMonth", interestPerMonth);
    } else {
      setValue("interestPerMonth", "");
    }
  }, [loanAmount, interest, setValue]);

 

  // Query for fetching loan data in edit mode
  const { isLoading: isFetchingLoan } = useQuery({
    queryKey: ["loan", loanId],
    queryFn: async (): Promise<LoanData> => {
      if (!loanId) throw new Error("Loan ID is required");
      return get(`/loans/${loanId}`);
    },
    enabled: mode === "edit" && !!loanId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Handle successful loan fetch
  useEffect(() => {
    if (mode === "edit" && loanId) {
      queryClient.fetchQuery({
        queryKey: ["loan", loanId],
        queryFn: async (): Promise<LoanData> => {
          return get(`/loans/${loanId}`);
        },
      }).then((data) => {
        setValue("partyId", String(data.partyId));
        setValue("loanDate", data.loanDate.slice(0,10));
        setValue("loanAmount", data.loanAmount.toString());
        setValue("balanceAmount", data.balanceAmount.toString());
        setValue("interest", data.interest.toString());
        setValue("interestPerMonth", data.interestPerMonth?.toString() || "");
        setValue("balanceInterest", data.balanceInterest.toString());
      }).catch((error) => {
        toast.error(error.message || "Failed to fetch loan details");
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/loans");
        }
      });
    }
  }, [loanId, mode, setValue, queryClient, navigate, onSuccess]);

  // Query for fetching parties for dropdown
  const { data: partiesData, isLoading: isLoadingParties } = useQuery({
    queryKey: ["parties", "all"],
    queryFn: () => get("/parties", { page: 1, limit: 1000, sortBy: "partyName", sortOrder: "asc" }),
    staleTime: 1000 * 60 * 10,
  });

  // Mutation for creating a party
  const createPartyMutation = useMutation<any, any, any>({
    mutationFn: (data: any) => {
      return post("/parties", data);
    },
    onSuccess: (createdParty) => {
      toast.success("Party created successfully");
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      return createdParty;
    },
    onError: (error: any) => {
      Validate(error, setError);
      const msg = extractErrorMessage(error);
      if (msg) {
        toast.error(msg);
      } else if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create party");
      }
    },
  });

  // Mutation for creating a loan
  const createLoanMutation = useMutation<any, any, any>({
    mutationFn: (data: LoanFormInputs) => {
      return post("/loans", data);
    },
    onSuccess: () => {
      toast.success("Loan created successfully");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/loans");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      const msg = extractErrorMessage(error);
      if (msg) {
        toast.error(msg);
      } else if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create loan");
      }
    },
  });

  // Mutation for updating a loan
  const updateLoanMutation = useMutation<any, any, any>({
    mutationFn: (data: LoanFormInputs) => {
      return put(`/loans/${loanId}`, data);
    },
    onSuccess: () => {
      toast.success("Loan updated successfully");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/loans");
      }
    },
    onError: (error: any) => {
      Validate(error, setError);
      const msg = extractErrorMessage(error);
      if (msg) {
        toast.error(msg);
      } else if (error.errors?.message) {
        toast.error(error.errors.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update loan");
      }
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<LoanFormInputs> = async (data) => {
    // Conditional validation based on party selection
    if (mode === "create" && selectedParty === "existing") {
      if (!data.partyId) {
        setError("partyId", { message: "Please select a party" });
        return;
      }
    }

    if (mode === "create" && selectedParty === "create") {
      // Validate party fields when creating new party
      if (!data.partyName || !data.accountNumber || !data.address || !data.mobile1) {
        if (!data.partyName) setError("partyName", { message: "Party name is required" });
        if (!data.accountNumber) setError("accountNumber", { message: "Account number is required" });
        if (!data.address) setError("address", { message: "Address is required" });
        if (!data.mobile1) setError("mobile1", { message: "Mobile number is required" });
        return;
      }

      // Create party first
      const partyData = {
        partyName: data.partyName,
        accountNumber: data.accountNumber,
        address: data.address,
        mobile1: data.mobile1,
        mobile2: "", // Optional field
        reference: data.reference,
        referenceMobile1: data.referenceMobile1,
        referenceMobile2: "", // Optional field
      };

      try {
        const createdParty = await createPartyMutation.mutateAsync(partyData);
        
        // Create loan with the newly created party ID
        const loanPayload = {
          partyId: createdParty.id,
          loanDate: data.loanDate,
          loanAmount: Number(data.loanAmount),
          balanceAmount: Number(data.balanceAmount) || Number(data.loanAmount),
          interest: Number(data.interest),
          interestPerMonth: Number(data.interestPerMonth) || 0,
          balanceInterest: Number(data.balanceInterest) || 0,
        };
        
        createLoanMutation.mutate(loanPayload);
      } catch (error) {
        // Error handling is already done in createPartyMutation onError
        console.error("Failed to create party:", error);
      }
    } else {
      // Convert string inputs to numbers to match backend expectations
      if (!data.partyId) {
        setError("partyId", { message: "Please select a party" });
        return;
      }
      const payload = {
        partyId: parseInt(data.partyId, 10),
        loanDate: data.loanDate,
        loanAmount: Number(data.loanAmount),
        balanceAmount: Number(data.balanceAmount) || Number(data.loanAmount),
        interest: Number(data.interest),
        interestPerMonth: Number(data.interestPerMonth) || 0,
        balanceInterest: Number(data.balanceInterest) || 0,
      };
      if (mode === "create") {
        createLoanMutation.mutate(payload);
      } else {
        updateLoanMutation.mutate(payload);
      }
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate("/loans");
    }
  };

  // Combined loading loan from fetch and mutations
  const isFormLoading = isFetchingLoan || createLoanMutation.isPending || updateLoanMutation.isPending || createPartyMutation.isPending;

  // state for combobox popover
  const [openParty, setOpenParty] = useState(false);
  // state for party selection - always "existing" in edit mode
  const [selectedParty, setSelectedParty] = useState("existing");

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {/* Radio buttons for party selection - Only show in create mode */}
        {mode === "create" && (
          <div className="grid gap-4 mb-6">
            <Label>Party Selection <span className="text-red-500">*</span></Label>
            <RadioGroup
              defaultValue="existing"
              onValueChange={(value) => setSelectedParty(value)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing">Existing Party</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="create" id="create" />
                <Label htmlFor="create">Create Party</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Conditional rendering based on radio selection */}
        {/* In edit mode, always show existing party selection. In create mode, show based on radio selection */}
        {(mode === "edit" || selectedParty === "existing") ? (
          <div className="grid gap-2 relative mb-6">
            <Label htmlFor="partyId" className="block mb-2">Select Party <span className="text-red-500">*</span></Label>
            <Controller
              name="partyId"
              control={control}
              render={({ field }) => (
                <Popover open={openParty} onOpenChange={setOpenParty}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={isFormLoading || isLoadingParties}
                    >
                      {field.value
                        ? partiesData?.parties?.find((p: any) => String(p.id) === field.value)?.partyName
                        : isLoadingParties
                        ? "Loading..."
                        : "Select a party"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[90vw] sm:w-[440px]">
                    <Command>
                      <CommandInput placeholder="Search party..." />
                      <CommandEmpty>No party found.</CommandEmpty>
                      <CommandList >
                        {partiesData?.parties?.map((party: any) => (
                          <CommandItem
                            key={party.id}
                            value={party.partyName}
                            onSelect={() => {
                              field.onChange(String(party.id));
                              setOpenParty(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === String(party.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {party.partyName}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.partyId && (
              <span className="block text-xs text-destructive">
                {errors.partyId.message}
              </span>
            )}
          </div>
        ) : (
          <div className=" ">
             <div className="grid gap-2 relative">
              <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col">
            <Label htmlFor="accountNumber" className="mb-2">Account Number <span className="text-red-500">*</span></Label>
            <Input
              id="accountNumber"
              placeholder="Enter account number"
              {...register("accountNumber")}
              disabled={isFormLoading}
            />
            {errors.accountNumber && (
              <span className="mt-1 text-xs text-destructive">
                {errors.accountNumber.message}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <Label htmlFor="partyName" className="mb-2">Party Name <span className="text-red-500">*</span></Label>
            <Input
              id="partyName"
              placeholder="Enter party name"
              {...register("partyName")}
              disabled={isFormLoading}
            />
            {errors.partyName && (
              <span className="mt-1 text-xs text-destructive">
                {errors.partyName.message}
              </span>
            )}
          </div>
          </div>
          
          {/* Account Number Field */}
       
          
            <div className="grid grid-cols-2 gap-4">
            <div>
            <Label htmlFor="address" className="block mb-2">Address <span className="text-red-500">*</span></Label>
            <Input
              id="address"
              placeholder="Enter address"
              {...register("address")}
              disabled={isFormLoading}
            />
            {errors.address && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.address.message}
              </span>
            )}

            </div>
              <div>
            {/* Mobile 1 Field */}
            <Label htmlFor="mobile1" className="block mb-2">Mobile 1 <span className="text-red-500">*</span></Label>
            <Input
              id="mobile1"
              placeholder="Enter mobile number"
              {...register("mobile1")}
              disabled={isFormLoading}
              maxLength={10}
type="tel"
            />
            {errors.mobile1 && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.mobile1.message}
              </span>
            )}
            </div>
           
            </div>

        

            <div className="grid grid-cols-2 gap-4">
            <div>
    {/* Reference Field */}
    <Label htmlFor="reference" className="block mb-2">Reference</Label>
            <Input
              id="reference"
              placeholder="Enter reference"
              {...register("reference")}
              disabled={isFormLoading}
            />
            {errors.reference && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.reference.message}
              </span>
            )}

              </div>
              <div>
                {/* Reference Mobile 1 Field */}
                <Label htmlFor="referenceMobile1" className="block mb-2">Reference Mobile 1</Label>
                <Input
                  id="referenceMobile1"
                  placeholder="Enter reference mobile number"
                  {...register("referenceMobile1")}
                  disabled={isFormLoading}
                  maxLength={10}
                  type="tel"
                />
                {errors.referenceMobile1 && (
                  <span className="mt-1 block text-xs text-destructive">
                    {errors.referenceMobile1.message}
                  </span>
                )}
              </div>
            
              
            </div>
        </div>
        <Separator />
       </div>
               
        )}

        
        {/* Loan Date and Amount */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="loanDate" className="block mb-2">Loan Date <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              id="loanDate"
              placeholder="Enter loan date"
              {...register("loanDate")}
              disabled={isFormLoading}
            />
            {errors.loanDate && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.loanDate.message}
              </span>
            )}
          </div>
          <div>
            <Label htmlFor="loanAmount" className="block mb-2">Loan Amount <span className="text-red-500">*</span></Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                ₹
              </span>
              <Input
                type="number"
                id="loanAmount"
                placeholder="Enter loan amount"
                {...register("loanAmount")}
                disabled={isFormLoading}
                className="pl-7"
              />
            </div>
            {errors.loanAmount && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.loanAmount.message}
              </span>
            )}
          </div>
          <div className="mb-6">
          <Label htmlFor="interest" className="block mb-2">Interest (%) <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            id="interest"
            placeholder="Enter interest"
            {...register("interest")}
            disabled={isFormLoading}
          />
          {errors.interest && (
            <span className="mt-1 block text-xs text-destructive">
              {errors.interest.message}
            </span>
          )}
        </div>
        </div>

        {/* Interest */}
       

        {/* Additional Fields */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="balanceAmount" className="block mb-2">Balance Amount</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                ₹
              </span>
              <Input
                type="number"
                id="balanceAmount"
                placeholder="Enter balance amount"
                {...register("balanceAmount")}
                disabled={isFormLoading}
                className="pl-7"
              />
            </div>
            {errors.balanceAmount && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.balanceAmount.message}
              </span>
            )}
          </div>
          <div>
            <Label htmlFor="interestPerMonth" className="block mb-2">Interest/Mo</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                ₹
              </span>
              <Input
                type="number"
                id="interestPerMonth"
                placeholder="Auto-calculated"
                {...register("interestPerMonth")}
                disabled={true}
                readOnly={true}
                className="pl-7 bg-gray-50"
              />
            </div>
            {errors.interestPerMonth && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.interestPerMonth.message}
              </span>
            )}
          </div>
          <div>
            <Label htmlFor="balanceInterest" className="block mb-2">Balance Interest</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                ₹
              </span>
              <Input
                type="number"
                id="balanceInterest"
                placeholder="Enter balance interest"
                {...register("balanceInterest")}
                disabled={isFormLoading}
                className="pl-7"
              />
            </div>
            {errors.balanceInterest && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.balanceInterest.message}
              </span>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isFormLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isFormLoading}>
            {isFormLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create" : "Update"} Loan
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;
