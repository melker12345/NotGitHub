import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import repositoryService from '../services/repositoryService';

import { useAuth } from '../contexts/AuthContext';

function RepositorySettingsPage() {
  const { username, reponame } = useParams();
  const navigate = useNavigate();
  const [repository, setRepository] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchRepository = async () => {
      try {
        const data = await repositoryService.getRepositoryByPath(username, reponame);
        setRepository(data);
        setFormData({
          name: data.name,
          description: data.description || '',
          is_public: data.is_public,
        });
        setError('');
      } catch (err) {
        console.error('Error fetching repository:', err);
        setError('Failed to load repository details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepository();
  }, [username, reponame]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await repositoryService.updateRepositoryByPath(username, reponame, formData);
      setSuccessMessage('Repository settings updated successfully');
      
      // Update local repository state
      setRepository((prev) => ({
        ...prev,
        ...formData,
      }));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating repository:', err);
      setError('Failed to update repository settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gh-dark-accent-blue"></div>
      </div>
    );
  }

  if (error && !repository) {
    return (
      <div className="bg-red-800 border border-red-600 text-red-200 px-4 py-3 rounded">
        {error}
        <p className="mt-2">
          <Link to="/" className="text-red-200 underline">
            Return to home
          </Link>
        </p>
    </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen text-gh-dark-text-primary">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6 text-gh-dark-text-secondary">
        <Link 
          to={`/${username}/${reponame}`} 
          className="text-gh-dark-accent-blue hover:underline"
        >
          {repository?.name}
        </Link>
        <span>/</span>
        <span>Settings</span>
      </div>

      {/* Settings Form */}
      <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-md border border-gh-dark-border-primary">
        <h1 className="text-2xl font-bold mb-6 text-gh-dark-text-primary">Repository Settings</h1>
        
        {error && (
          <div className="mb-4 bg-red-800 border border-red-600 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 bg-green-800 border border-green-600 text-green-200 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gh-dark-text-secondary mb-1">
              Repository Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gh-dark-border-secondary rounded-md shadow-sm focus:outline-none focus:ring-gh-dark-accent-blue focus:border-gh-dark-accent-blue bg-gh-dark-bg-tertiary text-gh-dark-text-primary"
              placeholder="Repository name"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gh-dark-text-secondary mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gh-dark-border-secondary rounded-md shadow-sm focus:outline-none focus:ring-gh-dark-accent-blue focus:border-gh-dark-accent-blue bg-gh-dark-bg-tertiary text-gh-dark-text-primary"
              placeholder="Brief description of your repository"
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center">
              <input
                id="is_public"
                name="is_public"
                type="checkbox"
                checked={formData.is_public}
                onChange={handleChange}
                className="h-4 w-4 text-gh-dark-accent-blue focus:ring-gh-dark-accent-blue border-gh-dark-border-secondary rounded bg-gh-dark-bg-tertiary"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gh-dark-text-secondary">
                Public repository
              </label>
            </div>
            <p className="mt-1 text-sm text-gh-dark-text-muted">
              Public repositories are visible to anyone. Private repositories are only visible to you and collaborators you add.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 bg-gh-dark-accent-blue hover:bg-gh-dark-accent-blue-hover text-white rounded-md ${
                isSaving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-md border-t-4 border-red-600 border border-gh-dark-border-primary">
        <h2 className="text-xl font-semibold mb-4 text-gh-dark-text-primary">Danger Zone</h2>
        <div className="border border-gh-dark-border-secondary rounded-md">
          <div className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gh-dark-text-primary">Delete this repository</h3>
              <p className="text-sm text-gh-dark-text-muted">
                Once you delete a repository, there is no going back. Please be certain.
              </p>
            </div>
            <Link
              to={`/${username}/${reponame}`}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
            >
              Delete repository
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RepositorySettingsPage;
