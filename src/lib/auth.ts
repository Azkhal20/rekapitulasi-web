// Auth utilities for session management
export const AUTH_STORAGE_KEY = 'user';
export const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export interface UserData {
  username: string;
  role: string;
  fullName: string;
  loginTime?: number;
}

// Save user session
export const saveUserSession = (userData: Omit<UserData, 'loginTime'>) => {
  const sessionData: UserData = {
    ...userData,
    loginTime: Date.now(),
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
};

// Get user session
export const getUserSession = (): UserData | null => {
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;

    const userData: UserData = JSON.parse(data);
    
    // Check if session is expired
    if (userData.loginTime) {
      const elapsed = Date.now() - userData.loginTime;
      if (elapsed > SESSION_DURATION) {
        // Session expired
        clearUserSession();
        return null;
      }
    }

    return userData;
  } catch (error) {
    console.error('Error reading user session:', error);
    return null;
  }
};

// Clear user session
export const clearUserSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getUserSession() !== null;
};

// Get user initials from full name
export const getUserInitial = (fullName: string): string => {
  if (!fullName) return 'U';
  return fullName.charAt(0).toUpperCase();
};

// Format role for display
export const formatRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    viewer: 'Viewer',
  };
  return roleMap[role] || role;
};
