import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repositoryService } from '../../services/api';

function RepositoriesList() {
  const [repositories, setRepositories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        const response = await repositoryService.getUserRepositories();
        setRepositories(response.data);
        setError('');
      } catch (err) {
        setError('Failed to load repositories');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepositories();
  }, []);

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

  if (repositories.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-600 mb-4">You don't have any repositories yet.</p>
        <Link 
          to="/new-repository" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Repository
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {repositories.map((repo) => (
          <li key={repo.id} className="p-4 hover:bg-gray-50">
            <Link to={`/repositories/${repo.id}`} className="block">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-600">{repo.name}</h3>
                  {repo.description && (
                    <p className="mt-1 text-gray-600">{repo.description}</p>
                  )}
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span className={`mr-2 px-2 py-1 text-xs rounded ${repo.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {repo.is_public ? 'Public' : 'Private'}
                    </span>
                    <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RepositoriesList;
