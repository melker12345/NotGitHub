import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repositoryService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function UserProfilePage() {
  const { username } = useParams();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchUserRepositories();
  }, [username, page]);

  const fetchUserRepositories = async () => {
    try {
      setLoading(true);
      const offset = page * limit;
      const data = await repositoryService.getUserPublicRepositories(username, limit, offset);
      
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
      console.error(`Error fetching repositories for user ${username}:`, err);
      setError(`Failed to load repositories for ${username}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Check if viewing own profile
  const isOwnProfile = isAuthenticated && user && user.username === username;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{username}</h1>
          <p className="text-gray-600">User Profile</p>
        </div>
        {isOwnProfile && (
          <Link 
            to="/repositories/new" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            New Repository
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {isOwnProfile ? 'Your Repositories' : `${username}'s Repositories`}
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {repositories.map(repo => (
            <div key={repo.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    <Link 
                      to={`/${username}/${repo.name}`} 
                      className="text-blue-600 hover:underline"
                    >
                      {repo.name}
                    </Link>
                  </h3>
                  <p className="text-gray-600 mt-1">{repo.description || 'No description provided'}</p>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${repo.is_public ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {repo.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>Updated on {formatDate(repo.updated_at || repo.created_at)}</span>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

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

        {!loading && repositories.length === 0 && !error && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {isOwnProfile 
                ? "You don't have any repositories yet." 
                : `${username} doesn't have any public repositories yet.`}
            </p>
            {isOwnProfile && (
              <p className="mt-2">
                <Link to="/repositories/new" className="text-blue-600 hover:underline">
                  Create a new repository
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfilePage;
