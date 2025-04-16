import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { repositoryService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

function RepositoryIssuesPage() {
  const { username, reponame } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [repository, setRepository] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  
  // Get the current tab from URL params or default to 'open'
  const activeTab = searchParams.get('state') || 'open';

  useEffect(() => {
    // Fetch the repository details
    const fetchRepository = async () => {
      try {
        const repo = await repositoryService.getRepositoryByPath(username, reponame);
        setRepository(repo.data);
      } catch (err) {
        console.error('Error fetching repository:', err);
        setError('Failed to load repository information');
      }
    };

    fetchRepository();
  }, [username, reponame]);

  useEffect(() => {
    // Reset page when tab changes
    setPage(0);
    setIssues([]);
    setHasMore(true);
  }, [activeTab]);

  useEffect(() => {
    // Fetch issues when page changes or tab changes
    const fetchIssues = async () => {
      try {
        setLoading(true);
        const offset = page * limit;
        
        // Filter issues based on active tab
        const isOpen = activeTab === 'open';
        
        // Call the API endpoint with the filter
        const data = await repositoryService.getRepositoryIssues(
          username, 
          reponame, 
          limit, 
          offset, 
          isOpen
        );
        
        // Handle case when data is null or undefined (no issues)
        if (!data) {
          setIssues([]);
          setHasMore(false);
          return;
        }
        
        // If we get fewer results than the limit, we've reached the end
        if (data.length < limit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        
        if (page === 0) {
          setIssues(data);
        } else {
          setIssues(prev => [...prev, ...data]);
        }
      } catch (err) {
        console.error('Error fetching issues:', err);
        // Don't show error to user, just set empty issues
        setIssues([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [username, reponame, page, activeTab]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  // Check if user can create issues (repo owner or public repo)
  const canCreateIssue = () => {
    if (!repository) return false;
    return isAuthenticated && (repository.is_public || (user && repository.owner_id === user.id));
  };
  
  // Handle tab change
  const changeTab = (tab) => {
    setSearchParams({ state: tab });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Issues - {username}/{reponame}</h1>
        {canCreateIssue() && (
          <Link
            to={`/${username}/${reponame}/issues/new`}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            New Issue
          </Link>
        )}
      </div>
      
      {/* Issue state tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => changeTab('open')}
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'open' 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
            Open
          </span>
        </button>
        <button
          onClick={() => changeTab('closed')}
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'closed' 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-purple-600 mr-2"></span>
            Closed
          </span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {issues.length > 0 ? (
          <div>
            {issues.map(issue => (
              <div key={issue.id} className="border-b border-gray-200 last:border-b-0">
                <Link
                  to={`/${username}/${reponame}/issues/${issue.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block w-3 h-3 rounded-full ${issue.is_open ? 'bg-green-500' : 'bg-purple-600'}`}></span>
                        <h3 className="text-lg font-semibold text-blue-600">{issue.title}</h3>
                      </div>
                      <p className="text-gray-600 mt-1 text-sm">
                        {issue.is_open ? 'Opened' : 'Closed'} on {formatDate(issue.created_at)} by {issue.created_by}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-600 text-sm">
                        <span className={`${issue.vote_count > 0 ? 'text-green-600' : issue.vote_count < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {issue.vote_count > 0 ? '+' : ''}{issue.vote_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
              </div>
            ) : (
              <>
                <p className="text-xl mb-2">No {activeTab} issues found</p>
                <p className="text-sm mb-4">
                {activeTab === 'open' && canCreateIssue() 
                  ? "Be the first to create an issue for this repository!" 
                  : activeTab === 'open'
                    ? "There are no open issues for this repository yet."
                    : "There are no closed issues for this repository yet."}
              </p>
              {error && (
                <p className="text-xs text-gray-500 mt-2">{error}</p>
              )}
              </>
            )}
          </div>
        )}
      </div>

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

      {/* Loading indicator */}
      {loading && issues.length > 0 && (
        <div className="flex justify-center my-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}

export default RepositoryIssuesPage;
