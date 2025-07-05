/**
 * TypeScript type definitions for PowerTeam and related entities.
 */

// Basic Category structure, assuming this is what's needed for display and selection.
// You might have a more detailed Category type elsewhere.
export interface CategorySummary {
  id: number;
  name: string;
  description?: string; // Optional, based on backend model
}

export interface PowerTeam {
  id: number;
  name: string;
  categories: CategorySummary[];
  subCategories?: SubCategorySummary[]; // Add this line
  createdAt?: string; // Optional, if needed from backend
  updatedAt?: string; // Optional, if needed from backend
}

// For creating or updating a PowerTeam
export interface PowerTeamInput {
  name: string;
  categoryIds: number[];
  subCategoryIds?: number[]; // Add this line
}

// For API responses that include pagination
export interface PaginatedPowerTeamResponse {
  powerTeams: PowerTeam[];
  page: number;
  totalPages: number;
  totalPowerTeams: number;
}

// General Category type, if you fetch categories for a dropdown
export interface Category {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

// Add SubCategorySummary type
export interface SubCategorySummary {
  id: number;
  name: string;
  categoryId: number; // To know which main category it belongs to
}

// Add SubCategory type
export interface SubCategory extends SubCategorySummary {
  description?: string; // If subcategories have descriptions
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedCategoryResponse {
  categories: Category[];
  page: number;
  totalPages: number;
  totalCategories: number;
}
