import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { repositoryService } from '../services/api';
import RepositoryCard from '../components/RepositoryCard';

function HomePage() {
  const { isAuthenticated } = useAuth();
  const [publicRepos, setPublicRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  
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
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching public repositories:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section for non-authenticated users */}
      {!isAuthenticated && (
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:py-16 lg:px-8">
            <div className="lg:flex lg:items-center lg:justify-between">
              <div className="lg:w-0 lg:flex-1">
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Welcome to GitHub Clone!
                </h2>
                <p className="mt-3 max-w-3xl text-lg text-indigo-100">
                  A self-hosted platform for code management and collaboration
                </p>
              </div>
              <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                <div className="inline-flex rounded-md shadow">
                  <Link to="/login" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50">
                    Sign In
                  </Link>
                </div>
                <div className="ml-3 inline-flex rounded-md shadow">
                  <Link to="/register" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600">
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Repository List */}
      <section className="bg-gray-800 text-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gh-dark-text-primary">Public Repositories</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gh-dark-accent-blue"></div>
          </div>
        ) : publicRepos.length > 0 ? (
          <div className="space-y-4">
            {publicRepos.map(repo => (
              <RepositoryCard key={repo.id} repository={repo} />
            ))}
          </div>
        ) : (
          <p className="text-gh-dark-text-muted text-center py-8">No public repositories found</p>
        )}
      </section>
    </div>
  );
}

export default HomePage
