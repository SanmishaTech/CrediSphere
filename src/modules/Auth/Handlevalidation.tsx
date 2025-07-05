// --- In handleApiValidationErrors.ts ---

import { FieldValues, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import axios from "axios";

// --- Interfaces --- (Keep as they are)
interface ApiValidationErrorItem {
  path?: string[];
  field?: string; // Added alternative field identifier
  message: string;
}

type ApiErrorResponseBody = {
  message?: string;
  error?: string | ApiValidationErrorItem[];
  errors?:
    | ApiValidationErrorItem[]
    | Record<string, string | string[] | ApiValidationErrorItem>; // Made more flexible
  [key: string]: any;
};

// --- getApiErrorBody --- (Keep as it is, assuming it works for your apiService)
function getApiErrorBody(error: unknown): ApiErrorResponseBody | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "object" && data !== null) {
      return data as ApiErrorResponseBody;
    }
    // If no response body, use the Axios error message or a default
    return { message: error.message || "Request failed via Axios." };
  }

  if (error instanceof Response && !error.ok) {
    // NOTE: Handling raw Fetch Response might require async parsing in apiService
    console.warn(
      "Handling raw Fetch Response object - parsing might be needed in apiService."
    );
    return { message: `HTTP error ${error.status} - ${error.statusText}` };
  }

  // Assume 'error' *is* the parsed JSON body if it's a plain object
  if (
    typeof error === "object" &&
    error !== null &&
    !(error instanceof Error)
  ) {
    return error as ApiErrorResponseBody;
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  // Cannot determine a structured body or message
  return null;
}

export function handleApiValidationErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  fieldNames: ReadonlyArray<keyof TFieldValues>
): boolean {
  console.error("API Error Raw:", error); // Good for debugging
  let fieldErrorsSet = false;
  const errorBody = getApiErrorBody(error);
  console.log("Parsed error body:", errorBody); // Good for debugging

  if (errorBody) {
    // --- Check 1: Specific structure { errors: [{ path: ["field"], message: "..." }] } ---
    if (Array.isArray(errorBody.errors)) {
      // Ensure items are objects before proceeding
      const validationErrors = errorBody.errors.filter(
        (item) => typeof item === "object" && item !== null
      ) as ApiValidationErrorItem[];

      validationErrors.forEach((item) => {
        const fieldName = item.path?.[0]; // Get field name from path array
        const message = item.message;

        if (
          typeof fieldName === "string" &&
          fieldNames.includes(fieldName as keyof TFieldValues) &&
          typeof message === "string" &&
          message
        ) {
          setError(fieldName as keyof TFieldValues, {
            type: "server",
            message,
          });
          fieldErrorsSet = true;
          console.log(
            `Set server error (from errors array) for ${fieldName}: ${message}`
          );
        } else {
          console.warn(
            `Skipping error item from 'errors' array (invalid field/message or structure):`,
            item
          );
        }
      });
    }

    // --- Check 2: Alternative array structure { error: [{ path/field: "field", message: "..." }] } ---
    // Run only if Check 1 didn't set errors
    if (!fieldErrorsSet && Array.isArray(errorBody.error)) {
      const validationErrors = errorBody.error.filter(
        (item) => typeof item === "object" && item !== null
      ) as ApiValidationErrorItem[];

      validationErrors.forEach((item) => {
        // Try 'path' first, then 'field' as fallback
        const fieldName = item.path?.[0] || item.field;
        const message = item.message;

        if (
          typeof fieldName === "string" &&
          fieldNames.includes(fieldName as keyof TFieldValues) &&
          typeof message === "string" &&
          message
        ) {
          setError(fieldName as keyof TFieldValues, {
            type: "server",
            message,
          });
          fieldErrorsSet = true;
          console.log(
            `Set server error (from error array) for ${fieldName}: ${message}`
          );
        } else {
          console.warn(
            `Skipping error item from 'error' array (invalid field/message or structure):`,
            item
          );
        }
      });
    }

    // --- Check 3: Object map structure { errors: { field1: "msg", field2: ["msg"] } } ---
    // Run only if previous checks didn't set errors
    if (
      !fieldErrorsSet &&
      typeof errorBody.errors === "object" &&
      errorBody.errors !== null &&
      !Array.isArray(errorBody.errors) // Ensure it's not the array from Check 1
    ) {
      Object.entries(errorBody.errors).forEach(
        ([fieldName, messageOrArray]) => {
          if (fieldNames.includes(fieldName as keyof TFieldValues)) {
            // Extract the first message if it's an array, or use the string directly
            const message = Array.isArray(messageOrArray)
              ? typeof messageOrArray[0] === "string"
                ? messageOrArray[0]
                : ""
              : typeof messageOrArray === "string"
              ? messageOrArray
              : ""; // Fallback for unexpected types

            if (message) {
              setError(fieldName as keyof TFieldValues, {
                type: "server",
                message,
              });
              fieldErrorsSet = true;
              console.log(
                `Set server error (from errors object map) for ${fieldName}: ${message}`
              );
            } else {
              console.warn(
                `Skipping error item for field '${fieldName}' from 'errors' object map (invalid message format):`,
                messageOrArray
              );
            }
          } else {
            console.warn(
              `Received error for field '${fieldName}' in 'errors' object map, but it's not in the form fields.`
            );
          }
        }
      );
    }

    // --- Fallback Toast ---
    // If no field-specific errors were set by *any* of the above checks, show a generic toast.
    if (!fieldErrorsSet) {
      // Prioritize a specific message from the API if available
      const genericMessage =
        (typeof errorBody.message === "string" && errorBody.message) ||
        (typeof errorBody.error === "string" && errorBody.error) || // Check top-level 'error' string
        "Operation failed. Please check your input or try again later.";
      toast.error(genericMessage);
      console.log("Displayed generic error toast:", genericMessage);
    }
  } else {
    // --- Ultimate Fallback --- Error body couldn't be parsed at all
    toast.error("An unexpected network or server error occurred.");
    console.log(
      "Displayed ultimate fallback error toast (could not parse body)."
    );
  }

  return fieldErrorsSet; // Return whether specific field errors were set
}
