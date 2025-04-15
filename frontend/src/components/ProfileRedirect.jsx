import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * A component that redirects to the current user's profile page.
 * This is used for the /profile route to show the user's personal profile.
 */
function ProfileRedirect() {
  const { user } = useAuth();

  // If the user object exists, redirect to their username profile page
  if (user && user.username) {
    return <Navigate to={`/${user.username}`} replace />;
  }

  // This should not happen since this component is wrapped in PrivateRoute,
  // but just in case, show loading or redirect to login
  return <div className="text-center py-8">Redirecting to your profile...</div>;
}

export default ProfileRedirect;
