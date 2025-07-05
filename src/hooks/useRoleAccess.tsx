import { useAuth } from './useAuth';

interface RoleAccessMethods {
  isAdmin: boolean;
  checkIsAdmin: () => boolean;
}

export function useRoleAccess(): RoleAccessMethods {
  // Try to use the auth context if available
  let user = null;
  
  try {
    // Try to get user from auth context
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    // Fallback to localStorage if AuthProvider is not available
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
      }
    }
  }
  
  // Check if the user has admin role
  const checkIsAdmin = (): boolean => {
    if (!user || !user.role) return false;
    return user.role.includes('admin');
  };

  // Pre-computed property for common check
  const isAdmin = checkIsAdmin();

  return {
    isAdmin,
    checkIsAdmin
  };
} 