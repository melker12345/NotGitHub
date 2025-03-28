import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import repositoryService from '../services/repositoryService';

function NewRepositoryPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await repositoryService.createRepository({
        name: formData.name,
        description: formData.description,
        is_public: formData.isPublic
      });
      
      // Get the currently logged in user
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      // Redirect to GitHub-style URL
      if (user && user.username) {
        navigate(`/${user.username}/${data.name}`);
      } else {
        // If for some reason username is not available, show an error
        setError('Could not redirect to the new repository. Please navigate to your profile to find it.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error creating repository:', err);
      if (err.response?.status === 409) {
        setError('A repository with this name already exists. Please choose a different name.');
      } else {
        setError(err.response?.data || 'Failed to create repository');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create a new repository</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Repository name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.name}
            onChange={handleChange}
          />
          <p className="mt-1 text-sm text-gray-500">
            Great repository names are short and memorable.
          </p>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <input
            type="text"
            id="description"
            name="description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.description}
            onChange={handleChange}
          />
          <p className="mt-1 text-sm text-gray-500">
            A short description of your repository.
          </p>
        </div>
        
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
              Public
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500 ml-6">
            Anyone can see this repository. You choose who can commit.
          </p>
          
          <div className="flex items-center mt-3">
            <input
              type="checkbox"
              id="isPrivate"
              name="isPublic"
              checked={!formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: !e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
              Private
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500 ml-6">
            You choose who can see and commit to this repository.
          </p>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create repository'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewRepositoryPage;
