import { useAuth } from '../context/AuthContext';

export const useRole = () => {
  const { user, loading } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || (!isAdmin && user);
  
  return {
    isAdmin,
    isStaff,
    hasRole: (role) => user?.role === role,
    loading
  };
};