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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Explore Repositories</h1>
        
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
