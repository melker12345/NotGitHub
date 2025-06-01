import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { repositoryService } from '../services/api';
import RepositoryCard from '../components/RepositoryCard';
import RepositoryListSection from '../components/RepositoryListSection';

function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [publicRepos, setPublicRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch public repositories for all users
  useEffect(() => {
    setLoading(true);
    repositoryService.getPublicRepositories(10, 0, 'newest')
      .then(data => {
        // Process the data to ensure each repository has proper owner information
        const processedData = data.filter(repo => {
          // Filter out repositories with missing critical information
          const hasOwnerInfo = repo.owner?.username || repo.owner_username;
          if (!hasOwnerInfo) {
            console.warn('Filtering out repository with missing owner information:', repo.name);
            return false;
          }
          return true;
        }).map(repo => {
          // Make sure each repository has a proper owner object
          if (!repo.owner || !repo.owner.username) {
            // Create a proper owner object using available data
            repo.owner = {
              id: repo.owner_id || '',
              username: repo.owner_username || '',
              email: repo.owner_email || ''
            };
          }
          return repo;
        });
        
        setPublicRepos(processedData);
        setError('');
      })
      .catch(err => {
        console.error('Error fetching public repositories:', err);
        setError('Failed to load public repositories.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section for authenticated users */}
      {isAuthenticated && user && (
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
            <div className="lg:flex lg:items-center lg:justify-between">
              <div className="lg:w-0 lg:flex-1">
                <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Welcome, {user?.username}!
                </h2>
                <p className="mt-2 max-w-3xl text-lg text-indigo-100">
                  Your self-hosted platform for code management and collaboration
                </p>
              </div>
              <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                <div className="inline-flex rounded-md shadow">
                  <Link to="/repositories/new" className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Repository
                  </Link>
                </div>
                <div className="ml-3 inline-flex rounded-md shadow">
                  <Link to="/explore" className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Explore
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      
      {/* Repository List */}
      <RepositoryListSection
        title="Public Repositories"
        loading={loading}
        error={error}
        repositories={publicRepos}
        showSort={false} // HomePage doesn't have sorting for this section
        showLoadMore={false} // HomePage doesn't have load more for this section
      />
    </div>
  );
}

export default HomePage
