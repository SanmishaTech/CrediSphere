export const ROLES = {
  ADMIN: "admin",
  BRANCH_ADMIN: "branch_admin",
  USER: "member",
} as const;

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.BRANCH_ADMIN]: "Branch Admin",
  [ROLES.USER]: "Member",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
