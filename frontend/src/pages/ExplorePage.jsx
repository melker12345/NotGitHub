import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { repositoryService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RepositoryCard from '../components/RepositoryCard';
import RepositoryVisibilityBadge from '../components/RepositoryVisibilityBadge';

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
      
      // If we get fewer results than the limit, we've reached the end
      if (data.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      if (page === 0) {
        setRepositories(data);
      } else {
        setRepositories(prev => [...prev, ...data]);
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
    setSortOption(e.target.value);
    setPage(0); // Reset to first page when sorting changes
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="mx-auto space-y-8">
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
                <Link to="/repositories/new" className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50">
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
      
      {/* Repository List Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Public Repositories</h1>
        
        {/* Sorting options */}
        <div className="flex items-center">
          <label htmlFor="sort" className="mr-2 text-gray-700">Sort by:</label>
          <select
            id="sort"
            value={sortOption}
            onChange={handleSortChange}
            className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Repository list */}
      <div className="space-y-4">
        {repositories.map(repo => (
          <RepositoryCard key={repo.id} repository={repo} />
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center my-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Load more button */}
      {!loading && hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Load More
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && repositories.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-gray-500">No public repositories found.</p>
          {isAuthenticated && (
            <p className="mt-2">
              <Link to="/new" className="text-blue-600 hover:underline">
                Create a new repository
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ExplorePage;
