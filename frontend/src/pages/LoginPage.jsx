import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { isTokenValid } from '../services/authService';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { login, authError, clearAuthError } = useAuth();
  
  // Clear auth errors when component mounts
  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);
  
  // Show auth errors from context
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.login(formData);
      const token = response.data.token;
      const refreshTokenValue = response.data.refreshToken; // Backend should provide this
      const user = response.data.user;

      if (!isTokenValid(token)) {
        setError('Received invalid or expired token from server.');
        setIsLoading(false);
        return;
      }

      // First, store the user data in localStorage so it's available to the AuthContext
      localStorage.setItem('user', JSON.stringify(user));
      console.log('LoginPage: Saved user to localStorage:', user);

      // Then login with the token, refresh token, and remember me option
      const loginSuccess = login(token, refreshTokenValue, rememberMe);
      
      if (loginSuccess) {
        setSuccess('Sign in successful! Redirecting...');
        
        // Navigate after a short delay to show success message
        setTimeout(() => {
          navigate('/repositories');
        }, 1000);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Failed to login. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };


  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-16rem)] text-gh-dark-text-secondary">
      <div className="bg-gh-dark-bg-secondary p-8 rounded-lg shadow-md w-full max-w-md border border-gh-dark-border-primary">
        <h1 className="text-2xl font-bold mb-6 text-center text-gh-dark-text-primary">Log in to GitHub Clone</h1>
        
        {error && (
          <div className="mb-4 bg-opacity-10 bg-gh-dark-accent-red border border-gh-dark-accent-red text-gh-dark-accent-red px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gh-dark-text-secondary mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gh-dark-border-primary rounded-md shadow-sm bg-gh-dark-bg-tertiary text-gh-dark-text-secondary focus:outline-none focus:ring-gh-dark-accent-blue focus:border-gh-dark-accent-blue"
              placeholder="your.email@example.com"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gh-dark-text-secondary mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gh-dark-border-primary rounded-md shadow-sm bg-gh-dark-bg-tertiary text-gh-dark-text-secondary focus:outline-none focus:ring-gh-dark-accent-blue focus:border-gh-dark-accent-blue"
              placeholder="••••••••"
            />
          </div>
          
          <div className="mb-6 flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={handleRememberMeChange}
              className="h-4 w-4 text-gh-dark-accent-blue focus:ring-gh-dark-accent-blue border-gh-dark-border-primary bg-gh-dark-bg-tertiary rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gh-dark-text-secondary">
              Remember me
            </label>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gh-dark-button-primary-text bg-gh-dark-accent-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gh-dark-accent-blue transition-colors duration-200 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gh-dark-text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-gh-dark-accent-blue hover:underline transition-colors duration-200">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
