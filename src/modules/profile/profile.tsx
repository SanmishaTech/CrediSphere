import { useEffect, useMemo, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, postupload, putupload } from "@/services/apiService"; // Assuming these are correctly implemented
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Validate from "@/lib/Handlevalidation"; // Assuming this is correctly implemented
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface Chapter {
  id: number;
  name: string;
  location: {
    id: number;
    location: string;
  };
  zones: Array<{
    id: number;
    name: string;
  }>;
}

export type MemberFormProps = {
  mode: "create" | "edit";
};

// Define base types for form values
type BaseMemberFormValues = {
  memberName: string;
  chapterId: number;
  category: string;
  businessCategory: string;
  gender: string;
  dob: Date;
  mobile1: string;
  mobile2: string | null;
  gstNo?: string;
  organizationName: string;
  businessTagline?: string;
  organizationMobileNo: string;
  organizationLandlineNo?: string;
  organizationEmail?: string;
  orgAddressLine1: string;
  orgAddressLine2?: string;
  orgLocation: string;
  orgPincode: string;
  organizationWebsite?: string;
  organizationDescription?: string;
  addressLine1: string;
  location: string;
  addressLine2?: string;
  pincode: string;
  specificAsk?: string;
  specificGive?: string;
  clients?: string;
  profilePicture?: File; // For new uploads
  coverPhoto?: File; // For new uploads
  logo?: File; // For new uploads
  email: string;
};

type CreateMemberFormValues = BaseMemberFormValues & {
  password: string;
  verifyPassword: string;
};

type EditMemberFormValues = BaseMemberFormValues;

// Union type for form values
type MemberFormValues = CreateMemberFormValues | EditMemberFormValues;

// Zod schema definition
const createMemberSchema = (mode: "create" | "edit") => {
  const baseSchema = z.object({
    memberName: z.string().min(1, "Name is required"),
    chapterId: z
      .number({ required_error: "Chapter is required" })
      .int()
      .min(1, "Chapter is required"),
    category: z.string().min(1, "Business category is required"),
    businessCategory: z
      .string()
      .min(1, "Another business category is required"),
    gender: z.string().optional(),
    dob: z.date({ required_error: "Date of birth is required" }),
    mobile1: z.string().regex(/^[0-9]{10}$/, "Valid mobile number is required"),
    mobile2: z
      .string()
      .regex(/^[0-9]{10}$/, "Valid mobile number is required")
      .or(z.literal(""))
      .transform((val) => (val === "" ? null : val))
      .nullable(),
    gstNo: z.string().optional(),
    organizationName: z.string().min(1, "Organization name is required"),
    businessTagline: z.string().optional(),
    organizationMobileNo: z
      .string()
      .regex(/^[0-9]{10}$/, "Valid mobile number is required"),
    organizationLandlineNo: z.string().optional(),
    organizationEmail: z
      .string()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
    orgAddressLine1: z.string().min(1, "Address is required"),
    orgAddressLine2: z.string().optional(),
    orgLocation: z.string().min(1, "Location is required"),
    orgPincode: z.string().regex(/^[0-9]{6}$/, "Invalid pincode"),
    organizationWebsite: z
      .string()
      .url("Invalid URL")
      .optional()
      .or(z.literal("")),
    organizationDescription: z.string().optional(),
    addressLine1: z.string().min(1, "Address is required"),
    location: z.string().min(1, "Location is required"),
    addressLine2: z.string().optional(),
    pincode: z.string().regex(/^[0-9]{6}$/, "Invalid pincode"),
    specificAsk: z.string().optional(),
    specificGive: z.string().optional(),
    clients: z.string().optional(),
    profilePicture: z.instanceof(File).optional(),
    coverPhoto: z.instanceof(File).optional(),
    logo: z.instanceof(File).optional(),
    email: z.string().email("Valid email is required"),
  });

  if (mode === "create") {
    return baseSchema
      .extend({
        password: z.string().min(6, "Password must be at least 6 characters"),
        verifyPassword: z
          .string()
          .min(6, "Password must be at least 6 characters"),
      })
      .refine((data) => data.password === data.verifyPassword, {
        message: "Passwords must match",
        path: ["verifyPassword"],
      });
  }
  return baseSchema;
};

// Environment variable for the API base URL (recommended)
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://15.207.30.113/";
// For this example, we'll use the hardcoded one if not available.
const IMAGE_BASE_URL =
  import.meta.env.VITE_BACKEND_URLND_URL || "http://localhost:3000/"; // Replace with your actual image base URL

export default function MemberForm({ mode }: MemberFormProps) {
  // const { id } = useParams<{ id: string }>();
  const id = JSON.parse(localStorage.getItem("user"))?.member?.id;
  console.log("ID from localStorage:", id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const memberSchema = useMemo(() => createMemberSchema(mode), [mode]);
  type FormValues = z.infer<typeof memberSchema>;

  // State to hold existing image URLs (relative paths) or null for each of the 3 slots
  const [existingImageUrls, setExistingImageUrls] = useState<(string | null)[]>(
    [null, null, null]
  );

  // Fetch chapters
  const { data: chapters = [], isLoading: loadingChapters } = useQuery<
    Chapter[]
  >({
    queryKey: ["chapters"],
    queryFn: () => get("/chapters").then((r) => r.chapters),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      memberName: "",
      chapterId: undefined,
      category: "",
      businessCategory: "",
      gender: "",
      dob: new Date(), // Consider undefined and let Zod handle required or user pick
      mobile1: "",
      mobile2: null,
      gstNo: "",
      organizationName: "",
      businessTagline: "",
      organizationMobileNo: "",
      organizationLandlineNo: "",
      organizationEmail: "",
      orgAddressLine1: "",
      orgAddressLine2: "",
      orgLocation: "",
      orgPincode: "",
      organizationWebsite: "",
      organizationDescription: "",
      addressLine1: "",
      location: "",
      addressLine2: "",
      pincode: "",
      specificAsk: "",
      specificGive: "",
      clients: "",
      profilePicture: undefined,
      coverPhoto: undefined,
      logo: undefined,
      email: "",
      ...(mode === "create" ? { password: "", verifyPassword: "" } : {}),
    } as FormValues,
  });

  const { reset } = form;

  // Fetch member data for editing
  const { isLoading: loadingMember } = useQuery({
    queryKey: ["member", id],
    queryFn: async () => {
      const apiData = await get(`/api/members/${id}`);
      const {
        profilePicture, // Raw path from API
        coverPhoto, // Raw path from API
        logo, // Raw path from API
        chapter,
        ...restApiData
      } = apiData;

      // Process and validate image paths from API
      const apiImagePaths = [profilePicture, coverPhoto, logo];
      const processedImagePaths = apiImagePaths.map((path) => {
        if (
          path &&
          typeof path === "string" &&
          (path.startsWith("uploads/") || path.startsWith("/uploads/"))
        ) {
          // Basic check for common image extensions
          if (/\.(jpeg|jpg|gif|png|webp)$/i.test(path)) {
            return path; // It's a valid relative image path
          }
        }
        return null; // Invalid or not an image path we want to display
      });
      setExistingImageUrls(processedImagePaths);

      reset({
        ...restApiData,
        chapterId: chapter?.id || apiData.chapterId,
        dob: apiData.dob ? new Date(apiData.dob) : new Date(),
        // Form fields for new files should be undefined
        profilePicture: undefined,
        coverPhoto: undefined,
        logo: undefined,
        mobile2: apiData.mobile2 || null,
        organizationEmail: apiData.organizationEmail || "",
        organizationWebsite: apiData.organizationWebsite || "",
      } as FormValues); // Ensure this matches EditMemberFormValues structure

      return apiData;
    },
    enabled: mode === "edit" && !!id,
  });

  const categoryList = [
    "Printing",
    "Printing & Packaging",
    "Private Detective",
    "Project Management Consultant",
    "Property Advocate",
    "Puja Purohit",
    "Rainwater Harvesting",
    "Readymade Blouse",
    "Readymix Products",
    "Real Estate Consultant",
    "Recording Studio",
    "Restaurant",
    "SAP Consultant",
    "Sarees",
    "Scientific Equipments",
    "Security",
    "Security System",
    "Set Designer",
    "Share and Stock Broker",
    "Sheet Metal Components & Dies Mfg.",
  ];

  // Mutations
  const createMutation = useMutation<any, Error, MemberFormValues>({
    mutationFn: (data: MemberFormValues) => {
      const formData = new FormData();
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = (data as any)[key];
          if (value instanceof File) {
            formData.append(key, value);
          } else if (value instanceof Date) {
            formData.append(key, value.toISOString().split("T")[0]);
          } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        }
      }
      return postupload("/api/members", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member created successfully");

      // navigate("/members");
    },
    onError: (error: any) => {
      Validate(error, form.setError);
      toast.error(error.response?.data?.message || "Failed to create member");
    },
  });

  const updateMutation = useMutation<any, Error, MemberFormValues>({
    mutationFn: (data: MemberFormValues) => {
      const formData = new FormData();
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = (data as any)[key];
          if (value instanceof File) {
            formData.append(key, value);
          } else if (value instanceof Date) {
            formData.append(key, value.toISOString().split("T")[0]);
          } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        }
      }
      return putupload(`/api/members/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member", id] });
      toast.success("Member updated successfully");
      window.location.reload();
      // navigate("/members");
    },
    onError: (error: any) => {
      Validate(error, form.setError);
      toast.error(error.response?.data?.message || "Failed to update member");
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (mode === "create") {
      createMutation.mutate(data as CreateMemberFormValues);
    } else {
      updateMutation.mutate(data as EditMemberFormValues);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (mode === "edit" && loadingMember) {
    return (
      <Card className="mx-auto my-8">
        <CardContent className="p-6">Loading member data…</CardContent>
      </Card>
    );
  }
  if (loadingChapters && chapters.length === 0) {
    return (
      <Card className="mx-auto my-8">
        <CardContent className="p-6">Loading form options…</CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto my-8 ">
      {" "}
      {/* Added max-width for better layout */}
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Create New Profile" : "Edit Profile"}
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Fill out the form to create a member profile."
            : "Update the Profile details below."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Basic Details */}
          <Card className="mb-6 shadow-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Basic Details</CardTitle>{" "}
              {/* Slightly smaller title */}
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {" "}
              {/* Adjusted spacing */}
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="memberName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter member's full name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="chapterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) => field.onChange(Number(v))}
                        disabled={loadingChapters}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          {chapters.map((chapter) => (
                            <SelectItem
                              key={chapter.id}
                              value={String(chapter.id)}
                            >
                              {chapter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Category</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select business category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryList.map((catItem) => (
                            <SelectItem key={catItem} value={catItem}>
                              {catItem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Another Business Category</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Specialized Consulting"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {["male", "female", "other"].map((genderVal) => (
                            <SelectItem key={genderVal} value={genderVal}>
                              {genderVal.charAt(0).toUpperCase() +
                                genderVal.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal justify-start" // Ensure text aligns left
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile 1</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="10-digit mobile" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Optional 10-digit mobile"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="gstNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Enter GST number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card className="mb-6 shadow-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter organization name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessTagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Tagline (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="e.g., Quality Solutions Delivered"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="organizationMobileNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Mobile</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="10-digit mobile" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizationLandlineNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Landline (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Include STD code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizationEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          type="email"
                          placeholder="org@example.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="orgAddressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Building, Street" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="orgAddressLine2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Area, Landmark"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="orgLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City/Town" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="orgPincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Pincode</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="6-digit pincode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizationWebsite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          type="url"
                          placeholder="https://example.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="organizationDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Briefly describe the organization"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Member Address Details */}
          <Card className="mb-6 shadow-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Member Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="House No, Street" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Area, Landmark"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City/Town" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="6-digit pincode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="mb-6 shadow-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <FormField
                control={form.control}
                name="specificAsk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Ask (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="What are you looking for?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specificGive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Give (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="What can you offer?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Clients (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="e.g., ABC Corp, XYZ Ltd."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Profile Pictures Section */}
          <Card className="mb-6 shadow-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Profile Pictures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {[0, 1, 2].map((index) => {
                  // existingImageUrls is an array of (string | null)

                  // existingImageUrls[index] gives the relative path or null for the current slot
                  const relativeImagePath = existingImageUrls[index];
                  const fieldName = `profilePicture${
                    index + 1
                  }` as keyof FormValues; // profilePicture, coverPhoto, logo

                  // Construct full URL for display only if a valid relative path exists
                  const displayUrl = relativeImagePath
                    ? `${IMAGE_BASE_URL}/${
                        relativeImagePath.startsWith("/")
                          ? relativeImagePath.substring(1)
                          : relativeImagePath
                      }`
                    : null;

                  return (
                    <FormField
                      key={fieldName} // Use fieldName for a more stable key
                      control={form.control}
                      name={fieldName} // This form field is for NEW File uploads
                      render={(
                        { field: { onChange, value, ...fieldProps } } // `value` here would be the File object if selected
                      ) => (
                        <FormItem>
                          <FormLabel>{`Profile Picture ${
                            index + 1
                          }`}</FormLabel>
                          <div className="space-y-2">
                            {mode === "edit" && displayUrl && (
                              <div className="relative w-full aspect-square rounded-md overflow-hidden border border-dashed">
                                <img
                                  src={displayUrl}
                                  alt={`Current Profile ${index + 1}`}
                                  className="object-cover w-full h-full"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                    // You could show a placeholder or an icon here
                                    const parent = (
                                      e.target as HTMLImageElement
                                    ).parentElement;
                                    if (parent) {
                                      const placeholderText =
                                        document.createElement("span");
                                      placeholderText.textContent =
                                        "Image not found";
                                      placeholderText.className =
                                        "flex items-center justify-center w-full h-full text-xs text-gray-500";
                                      parent.appendChild(placeholderText);
                                    }
                                  }}
                                />
                              </div>
                            )}
                            {/* Input for uploading a new image or replacing existing */}
                            <FormControl>
                              <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  onChange(file || undefined); // Update RHF state with the File or undefined
                                }}
                                {...fieldProps} // name, onBlur, ref
                                className="w-full"
                              />
                            </FormControl>
                            {/* Display name of newly selected file (optional) */}
                            {value && (
                              <p className="text-xs text-gray-600 truncate">
                                Selected: {value.name}
                              </p>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Login Details */}
          <Card className="mb-6 shadow-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Login Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="user@example.com"
                        disabled={mode === "edit"}
                        className={mode === "edit" ? "bg-muted" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mode === "create" && (
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            placeholder="Min. 6 characters"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="verifyPassword" // This should be part of CreateMemberFormValues
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            placeholder="Retype password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <CardFooter className="flex justify-end space-x-4 mt-8">
            {" "}
            {/* Added margin top */}
            <Button
              type="button"
              variant="outline"
              // onClick={() => navigate("/members")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (mode === "edit" && loadingMember)}
            >
              {isLoading
                ? "Saving..."
                : mode === "create"
                ? "Create Member"
                : "Update Profile"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
