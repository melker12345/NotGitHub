import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { repositoryService } from '../services/api';
import { format } from 'date-fns';
import { getToken } from '../services/authService'; // Import getToken

function UserSettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(''); // TODO: Consider separate error/success states for each form section (Profile, Password) for better UX.
  const [successMessage, setSuccessMessage] = useState(''); // TODO: Consider separate error/success states for each form section (Profile, Password) for better UX.
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newlyGeneratedToken, setNewlyGeneratedToken] = useState('');
  const [tokenGenerationLoading, setTokenGenerationLoading] = useState(false);
  const [tokenGenerationError, setTokenGenerationError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
      }));
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user?.username) return;
    
    try {
      setStatsLoading(true);
      const stats = await repositoryService.getUserStats(user.username);
      setUserStats(stats);
    } catch (err) {
      console.error(`Error fetching stats for user ${user.username}:`, err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // TODO: Implement backend API call for profile update.
      // Example: await userService.updateProfile({ username: formData.username, email: formData.email });
      // Ensure backend handles username uniqueness and email validation if changed.
      setSuccessMessage('Profile updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // TODO: Implement backend API call for password change.
      // Example: await userService.changePassword({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
      setSuccessMessage('Password changed successfully');
      
      // Clear form fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement backend API call for account deletion.
      // Example: await userService.deleteAccount(user.id);
      // This is a critical action and needs robust confirmation and handling on the backend.
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account');
      setIsLoading(false);
    }
  };

  const handleGenerateToken = async () => {
    setTokenGenerationLoading(true);
    setTokenGenerationError('');
    setNewlyGeneratedToken(''); // Clear previous token
    try {
      const response = await repositoryService.generateGitAccessToken();
      if (response.data && response.data.git_access_token) {
        setNewlyGeneratedToken(response.data.git_access_token);
      } else {
        setTokenGenerationError('Failed to retrieve token from response.');
      }
    } catch (err) {
      console.error('Error generating Git access token:', err);
      setTokenGenerationError(err.response?.data?.error || err.message || 'Failed to generate token. Ensure you are logged in.');
    } finally {
      setTokenGenerationLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy');
  };

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-gh-dark-text-secondary mb-4">You need to be logged in to view this page.</p>
        <Link to="/login" className="px-4 py-2 bg-gh-dark-accent-blue text-white rounded hover:opacity-90">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gh-dark-text-primary">Account Settings</h1>
      
      {/* Account Information */}
      <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-md border border-gh-dark-border-primary">
        <h2 className="text-xl font-semibold mb-4 text-gh-dark-text-primary">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gh-dark-text-secondary text-sm">Username</p>
            <p className="text-gh-dark-text-primary font-medium">{user.username}</p>
          </div>
          <div>
            <p className="text-gh-dark-text-secondary text-sm">Email</p>
            <p className="text-gh-dark-text-primary font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-gh-dark-text-secondary text-sm">Account Created</p>
            <p className="text-gh-dark-text-primary font-medium">{formatDate(user.created_at)}</p>
          </div>
          <div>
            <p className="text-gh-dark-text-secondary text-sm">Repositories</p>
            <p className="text-gh-dark-text-primary font-medium">
              {statsLoading ? 'Loading...' : userStats?.total_repositories || '0'}
            </p>
          </div>
        </div>
        <Link to={`/${user.username}`} className="text-gh-dark-accent-blue hover:underline">
          View Public Profile
        </Link>
      </div>
      
      {/* Profile Settings Form */}
      <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-md border border-gh-dark-border-primary">
        <h2 className="text-xl font-semibold mb-4 text-gh-dark-text-primary">Profile Settings</h2>
        
        {error && (
          <div className="mb-4 bg-opacity-10 bg-gh-dark-accent-red border border-gh-dark-accent-red text-gh-dark-accent-red px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 bg-opacity-10 bg-gh-dark-accent-green border border-gh-dark-accent-green text-gh-dark-accent-green px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleProfileUpdate}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gh-dark-text-secondary mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gh-dark-bg-tertiary border border-gh-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-gh-dark-accent-blue focus:border-gh-dark-accent-blue text-gh-dark-text-primary"
              placeholder="Username"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gh-dark-text-secondary mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gh-dark-bg-tertiary border border-gh-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-gh-dark-accent-blue focus:border-gh-dark-accent-blue text-gh-dark-text-primary"
              placeholder="Email"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 bg-gh-dark-accent-blue hover:opacity-90 text-white rounded-md ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Password Change Form */}
      <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-md border border-gh-dark-border-primary">
        <h2 className="text-xl font-semibold mb-4 text-gh-dark-text-primary">Change Password</h2>
        
        <form onSubmit={handlePasswordChange}>
          <div className="mb-4">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gh-dark-text-secondary mb-1">
              Current Password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gh-dark-bg-tertiary border border-gh-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-gh-dark-accent-blue focus:border-gh-dark-accent-blue text-gh-dark-text-primary"
              placeholder="Current Password"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gh-dark-text-secondary mb-1">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gh-dark-bg-tertiary border border-gh-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-gh-dark-accent-blue focus:border-gh-dark-accent-blue text-gh-dark-text-primary"
              placeholder="New Password"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gh-dark-text-secondary mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gh-dark-bg-tertiary border border-gh-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-gh-dark-accent-blue focus:border-gh-dark-accent-blue text-gh-dark-text-primary"
              placeholder="Confirm New Password"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 bg-gh-dark-accent-blue hover:opacity-90 text-white rounded-md ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Git Access Token (via HTTP) Section */}
      <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-md border border-gh-dark-border-primary mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gh-dark-text-primary">Persistent Git Access Token</h2>
        <p className="text-gh-dark-text-secondary mb-4">
          Generate a long-lived token to authenticate Git operations over HTTP. This token is persistent and will not change when you log out.
        </p>
        
        <button
          onClick={handleGenerateToken}
          disabled={tokenGenerationLoading}
          className="mb-4 px-4 py-2 bg-gh-dark-accent-green hover:opacity-90 text-white rounded-md text-sm font-medium disabled:opacity-50"
        >
          {tokenGenerationLoading ? 'Generating...' : 'Generate New Git Access Token'}
        </button>

        {tokenGenerationError && (
          <p className="text-sm text-gh-dark-accent-red mb-4">Error: {tokenGenerationError}</p>
        )}

        {newlyGeneratedToken && (
          <div className="mb-4 p-4 border border-gh-dark-accent-yellow bg-gh-dark-bg-info rounded-md">
            <p className="text-sm text-gh-dark-text-primary font-semibold mb-2">
              Your new Git Access Token (shown once): 
            </p>
            <p className="text-xs text-gh-dark-accent-yellow mb-2">
              Copy this token now. You will not be able to see it again!
            </p>
            <div className="flex items-center space-x-2">
              <input
                id="newGitAccessToken"
                type="text"
                readOnly
                value={newlyGeneratedToken}
                className="w-full px-3 py-2 bg-gh-dark-bg-tertiary border border-gh-dark-border-primary rounded-md shadow-sm text-gh-dark-text-primary focus:outline-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(newlyGeneratedToken)}
                className="px-3 py-2 bg-gh-dark-button-secondary-bg hover:bg-gh-dark-button-secondary-hover text-gh-dark-button-secondary-text rounded-md"
                title="Copy token"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 2a1 1 0 00-1 1v1H5a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1h-2V3a1 1 0 00-1-1H8zM7 4h6v1H7V4zm5 5H8v6h4V9z" />
                  <path d="M8 5a1 1 0 00-1 1v10a1 1 0 001 1h4a1 1 0 001-1V6a1 1 0 00-1-1H8z" fillOpacity="0.5"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        <h3 className="text-lg font-medium text-gh-dark-text-primary mt-6 mb-2">How to Use Your Git Access Token:</h3>
        <p className="text-gh-dark-text-secondary mb-2">
          To use your generated Git access token with your Git client, configure the <code>http.extraHeader</code> setting for your repository. Run the following command in your local repository directory:
        </p>
        <pre className="bg-gh-dark-bg-tertiary p-3 rounded-md text-sm text-gh-dark-text-primary overflow-x-auto">
          <code>
            git config --local http.YOUR_REPOSITORY_URL.extraHeader "Authorization: Bearer YOUR_TOKEN_HERE"
          </code>
        </pre>
        <p className="text-gh-dark-text-secondary mt-2 mb-1">
          Replace <code>YOUR_REPOSITORY_URL</code> with the base URL of the Git server for HTTP access (e.g., <code>http://localhost:3000</code> or your production domain). The exact URL path for the <code>extraHeader</code> config might depend on your Git server's specifics; often it's the server's root or a common prefix for all repositories.
        </p>
        <p className="text-gh-dark-text-secondary mb-1">
          Replace <code>YOUR_TOKEN_HERE</code> with the persistent token you generated and copied.
        </p>
        <p className="text-sm text-gh-dark-text-tertiary mt-3">
          <strong>Important:</strong> Store this token securely, like a password. If you lose it or it's compromised, generate a new one. This token provides direct access to your repositories via HTTP.
        </p>
      </div>
      
      {/* SSH Keys Section */}
      <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-md border border-gh-dark-border-primary">
        <h2 className="text-xl font-semibold mb-4 text-gh-dark-text-primary">SSH Keys</h2>
        <p className="text-gh-dark-text-secondary mb-4">
          SSH keys are used to securely access your repositories via SSH.
        </p>
        <Link 
          to="/profile/ssh-keys" 
          className="px-4 py-2 bg-gh-dark-button-secondary-bg hover:bg-gh-dark-button-secondary-hover text-gh-dark-button-secondary-text rounded-md inline-block"
        >
          Manage SSH Keys
        </Link>
      </div>
      
      {/* Danger Zone */}
      <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-md border-t-4 border-gh-dark-accent-red">
        <h2 className="text-xl font-semibold mb-4 text-gh-dark-text-primary">Danger Zone</h2>
        <div className="border border-gh-dark-border-primary rounded-md">
          <div className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gh-dark-text-primary">Delete Account</h3>
              <p className="text-sm text-gh-dark-text-secondary">
                Once you delete your account, there is no going back. All your repositories, issues, and data will be permanently deleted.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-gh-dark-accent-red hover:opacity-90 text-white rounded-md text-sm"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-lg max-w-md w-full border border-gh-dark-border-primary">
            <h2 className="text-xl font-bold mb-4 text-gh-dark-text-primary">Delete Account</h2>
            <p className="mb-6 text-gh-dark-text-secondary">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gh-dark-button-secondary-bg hover:bg-gh-dark-button-secondary-hover text-gh-dark-button-secondary-text rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAccountDeletion}
                disabled={isLoading}
                className="px-4 py-2 bg-gh-dark-accent-red hover:opacity-90 text-white rounded-md"
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserSettingsPage;
