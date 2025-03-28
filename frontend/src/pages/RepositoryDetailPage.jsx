import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import repositoryService from '../services/repositoryService';

function RepositoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [repository, setRepository] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    const fetchRepository = async () => {
      try {
        const data = await repositoryService.getRepository(id);
        setRepository(data);
        setError('');
      } catch (err) {
        console.error('Error fetching repository:', err);
        setError('Failed to load repository details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepository();
  }, [id]);

  const handleDelete = async () => {
    try {
      await repositoryService.deleteRepository(id);
      navigate('/');
    } catch (err) {
      console.error('Error deleting repository:', err);
      setError('Failed to delete repository');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      },
      () => {
        setCopySuccess('Failed to copy');
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600">Repository not found</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to repositories
        </Link>
      </div>
    );
  }

  // Construct clone URLs
  const httpsCloneUrl = `http://localhost:8080/git/${repository.owner.username}/${repository.name}.git`;
  const sshCloneUrl = `ssh://git@localhost:2222/${repository.owner.username}/${repository.name}.git`;

  return (
    <div className="space-y-6">
      {/* Repository Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{repository.name}</h1>
            {repository.description && (
              <p className="mt-2 text-gray-600">{repository.description}</p>
            )}
            <div className="mt-3 flex items-center space-x-4">
              <span className={`px-2 py-1 text-xs rounded ${repository.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {repository.is_public ? 'Public' : 'Private'}
              </span>
              <span className="text-sm text-gray-500">
                Created on {new Date(repository.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/repositories/${id}/settings`}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
            >
              Settings
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Clone Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Clone Repository</h2>
        
        <div className="space-y-4">
          {/* HTTPS Clone */}
          <div>
            <h3 className="text-md font-medium mb-2">HTTPS</h3>
            <div className="flex items-center">
              <div className="flex-grow bg-gray-100 rounded-md p-3 font-mono text-sm overflow-x-auto">
                {httpsCloneUrl}
              </div>
              <button 
                onClick={() => copyToClipboard(httpsCloneUrl)}
                className="ml-2 p-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* SSH Clone */}
          <div>
            <h3 className="text-md font-medium mb-2">SSH</h3>
            <div className="flex items-center">
              <div className="flex-grow bg-gray-100 rounded-md p-3 font-mono text-sm overflow-x-auto">
                {sshCloneUrl}
              </div>
              <button 
                onClick={() => copyToClipboard(sshCloneUrl)}
                className="ml-2 p-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Don't forget to <Link to="/profile/ssh-keys" className="text-blue-600 hover:underline">add your SSH key</Link> before using SSH to clone.
            </p>
          </div>
          
          {copySuccess && (
            <div className="mt-2 text-sm text-green-600 font-medium">
              {copySuccess}
            </div>
          )}
        </div>
      </div>

      {/* Repository Files */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Repository Files</h2>
        <div className="bg-gray-100 p-8 rounded-md text-center">
          <p className="text-gray-600">
            This repository is empty. Clone the repository and push code to see files here.
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Delete Repository</h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete <span className="font-semibold">{repository.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepositoryDetailPage;
