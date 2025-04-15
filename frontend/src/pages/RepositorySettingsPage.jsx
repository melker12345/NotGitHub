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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error && !repository) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
        <p className="mt-2">
          <Link to="/" className="text-red-700 underline">
            Return to home
          </Link>
        </p>
    </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <Link 
          to={`/${username}/${reponame}`} 
          className="text-blue-600 hover:underline"
        >
          {repository?.name}
        </Link>
        <span className="text-gray-500">/</span>
        <span className="text-gray-700">Settings</span>
      </div>

      {/* Settings Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Repository Settings</h1>
        
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Repository Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Repository name"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                Public repository
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Public repositories are visible to anyone. Private repositories are only visible to you and collaborators you add.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md ${
                isSaving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-red-600">
        <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
        <div className="border border-gray-200 rounded-md">
          <div className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gray-900">Delete this repository</h3>
              <p className="text-sm text-gray-500">
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
