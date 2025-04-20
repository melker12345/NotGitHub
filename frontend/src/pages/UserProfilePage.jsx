import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repositoryService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import NumberSpinner from '../components/NumberSpinner';

function UserProfilePage() {
  const { username } = useParams();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const limit = 10;
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchUserRepositories();
    fetchUserStats();
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
    return format(date, 'MMM d, yyyy');
  };
  
  const fetchUserStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await repositoryService.getUserStats(username);
      setUserStats(stats);
    } catch (err) {
      console.error(`Error fetching stats for user ${username}:`, err);
      // We don't set an error here to avoid disrupting the whole page if stats fail
    } finally {
      setStatsLoading(false);
    }
  };

  // Check if viewing own profile
  const isOwnProfile = isAuthenticated && user && user.username === username;

  return (
    <div className="container mx-auto px-4 py-8 text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{username}</h1>
          <p className="text-gray-400">
            {userStats && !statsLoading ? 
              `Joined on ${formatDate(userStats.joined_date)}` : 
              'User Profile'}
          </p>
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
      
      {/* User Statistics Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-md border border-gray-700">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
              <NumberSpinner 
                value={userStats?.total_repositories} 
                color="blue" 
                isLoading={statsLoading} 
              />
              <div className="text-gray-300 text-sm">Total Repositories</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
              <NumberSpinner 
                value={userStats?.public_repositories} 
                color="green" 
                isLoading={statsLoading} 
              />
              <div className="text-gray-300 text-sm">Public Repositories</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
              <NumberSpinner 
                value={userStats?.total_commits} 
                color="purple" 
                isLoading={statsLoading} 
              />
              <div className="text-gray-300 text-sm">Total Commits</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
              <NumberSpinner 
                value={userStats?.total_lines_of_code} 
                color="orange" 
                isLoading={statsLoading} 
              />
              <div className="text-gray-300 text-sm">Lines of Code</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">
          {isOwnProfile ? 'Your Repositories' : `${username}'s Repositories`}
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {repositories.map(repo => (
            <div key={repo.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    <Link 
                      to={`/${username}/${repo.name}`} 
                      className="text-blue-500 hover:underline"
                    >
                      {repo.name}
                    </Link>
                  </h3>
                  <p className="text-gray-400 mt-1">{repo.description || 'No description provided'}</p>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${repo.is_public ? 'bg-green-800 text-green-200' : 'bg-yellow-800 text-yellow-200'}`}>
                    {repo.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                <span>Updated on {formatDate(repo.updated_at || repo.created_at)}</span>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <p className="text-gray-400">
              {isOwnProfile 
                ? "You don't have any repositories yet." 
                : `${username} doesn't have any public repositories yet.`}
            </p>
            {isOwnProfile && (
              <p className="mt-2">
                <Link to="/repositories/new" className="text-blue-500 hover:underline">
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
