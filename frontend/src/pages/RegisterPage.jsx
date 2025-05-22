import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Remove confirmPassword before sending to server
      const { confirmPassword, ...registerData } = formData;
      await authService.register(registerData);
      
      // Redirect to login page after successful registration
      navigate('/login', { 
        state: { message: 'Registration successful! Please log in.' } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message || 
        'Failed to register. Please try again with different credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-16rem)] text-gh-dark-text-secondary">
      <div className="bg-gh-dark-bg-secondary p-8 rounded-lg shadow-md w-full max-w-md border border-gh-dark-border-primary">
        <h1 className="text-2xl font-bold mb-6 text-center text-gh-dark-text-primary">Create your account</h1>
        
        {error && (
          <div className="mb-4 bg-opacity-10 bg-gh-dark-accent-red border border-gh-dark-accent-red text-gh-dark-accent-red px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gh-dark-border-primary rounded-md shadow-sm bg-gh-dark-bg-tertiary text-gh-dark-text-secondary focus:outline-none focus:ring-gh-dark-accent-blue focus:border-gh-dark-accent-blue"
              placeholder="johndoe"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gh-dark-border-primary rounded-md shadow-sm bg-gh-dark-bg-tertiary text-gh-dark-text-secondary focus:outline-none focus:ring-gh-dark-accent-blue focus:border-gh-dark-accent-blue"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gh-dark-button-primary-text bg-gh-dark-accent-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gh-dark-accent-blue transition-colors duration-200 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gh-dark-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-gh-dark-accent-blue hover:underline transition-colors duration-200">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
