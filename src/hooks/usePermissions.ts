import { useState, useEffect } from 'react';
import { getUserSession } from '@/lib/auth';

export const usePermissions = () => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchRole = () => {
      const user = getUserSession();
      if (user) {
        setRole(user.role);
      }
    };

    fetchRole();

    // Listen for storage changes (in case of logout/login in other tabs, though rare for SPA nav)
    const handleStorageChange = () => {
      fetchRole();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin'; 
  const isOperator = role === 'operator'; // Just in case, though user said "admin/operator" likely one role
  const isViewer = role === 'viewer';

  // Permissions Logic
  // Super Admin: All access
  // Admin: All access (based on user request)
  // Viewer: Read only
  
  const canCreate = isSuperAdmin || isAdmin || isOperator;
  const canEdit = isSuperAdmin || isAdmin || isOperator;
  const canDelete = isSuperAdmin || isAdmin; // Maybe restrict delete for Operator? For now, allow if Admin.

  return {
    role,
    canCreate,
    canEdit,
    canDelete,
    isViewer,
  };
};
