import { useState } from 'react';
import { repositoryService } from '../../services/api';

function CreateRepositoryForm({ onSuccess }) {
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
      await repositoryService.createRepository(formData);
      setFormData({ name: '', description: '', isPublic: true });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data || 'Failed to create repository');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Create New Repository</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Repository Name*
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., my-awesome-project"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="A short description of your repository"
          />
        </div>
        
        <div className="mb-6">
          <div className="flex items-center">
            <input
              id="isPublic"
              name="isPublic"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.isPublic}
              onChange={handleChange}
            />
            <label className="ml-2 block text-gray-700 text-sm font-bold" htmlFor="isPublic">
              Public Repository
            </label>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Public repositories are visible to anyone. Private repositories are only visible to you and collaborators you add.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Repository'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateRepositoryForm;
