import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repositoryService } from '../../services/api';
import RepositoryVisibilityBadge from '../RepositoryVisibilityBadge';
import { formatDistanceToNow } from 'date-fns';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gh-dark-accent-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-opacity-10 bg-gh-dark-accent-red border border-gh-dark-accent-red text-gh-dark-accent-red px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-md text-center">
        <p className="text-gh-dark-text-muted mb-4">You don't have any repositories yet.</p>
        <Link 
          to="/repositories/new" 
          className="bg-gh-dark-accent-blue hover:opacity-90 text-white font-bold py-2 px-4 rounded"
        >
          Create Repository
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gh-dark-bg-primary border border-gh-dark-border-primary rounded-lg shadow-sm overflow-hidden">
      <ul className="divide-y divide-gh-dark-border-primary">
        {repositories.map((repo) => (
          <li key={repo.id} className="p-4 hover:bg-gh-dark-bg-secondary ">
            <Link to={`/${repo.owner?.username || 'user'}/${repo.name}`} className="block">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gh-dark-accent-blue">{repo.name}</h3>
                  {repo.description && (
                    <p className="mt-1 text-gh-dark-text-muted">{repo.description}</p>
                  )}
                  <div className="mt-2 flex items-center text-sm text-gh-dark-text-muted">
                    <span className="mr-2">
                      <RepositoryVisibilityBadge isPublic={repo.is_public} size="sm" />
                    </span>
                    <span>Updated {formatDistanceToNow(new Date(repo.updated_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 self-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gh-dark-text-muted" viewBox="0 0 20 20" fill="currentColor">
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
