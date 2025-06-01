import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { repositoryService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RepositoryCard from '../components/RepositoryCard';
import RepositoryVisibilityBadge from '../components/RepositoryVisibilityBadge';
import RepositoryListSection from '../components/RepositoryListSection';

function ExplorePage() {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [sortOption, setSortOption] = useState('newest');
  const limit = 10;
  const { isAuthenticated } = useAuth();
  
  // Sorting options
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
  ];

  useEffect(() => {
    fetchRepositories();
  }, [page, sortOption]);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError('');
      const offset = page * limit;
      
      // Use the API service to fetch repositories
      const data = await repositoryService.getPublicRepositories(limit, offset, sortOption);
      
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
      
      // If we get fewer results than the limit, we've reached the end
      if (processedData.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      if (page === 0) {
        setRepositories(processedData);
      } else {
        setRepositories(prev => [...prev, ...processedData]);
      }
    } catch (err) {
      console.error('Error fetching public repositories:', err);
      setError('Failed to load repositories. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sort change
  const handleSortChange = (e) => {
    setRepositories([]); // Clear existing repositories
    setHasMore(true); // Reset hasMore
    setSortOption(e.target.value);
    setPage(0); // Reset to first page when sorting changes
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="mx-auto space-y-8 text-gh-dark-text-secondary">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-0 lg:flex-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Discover Public Repositories
              </h2>
              <p className="mt-2 max-w-3xl text-lg text-indigo-100">
                Explore projects from the community and find inspiration for your next project
              </p>
            </div>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link to="/repositories/new" className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-gh-dark-text-primary hover:bg-indigo-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Repository
                </Link>
              </div>
              {isAuthenticated && (
                <div className="ml-3 inline-flex rounded-md shadow">
                  <Link to="/repositories" className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    My Repositories
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      
      <RepositoryListSection
        title="Public Repositories"
        loading={loading}
        error={error}
        repositories={repositories}
        sortOptions={sortOptions}
        handleSortChange={handleSortChange}
        loadMore={loadMore}
        hasMore={hasMore}
        showSort={true}
        showLoadMore={true}
      />
    </div>
  );
}

export default ExplorePage;
