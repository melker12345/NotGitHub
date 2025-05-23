import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { repositoryService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

function IssueDetailPage() {
  const { username, reponame, issueid } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [repository, setRepository] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userVote, setUserVote] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch repository information first
        const repoResponse = await repositoryService.getRepositoryByPath(username, reponame);
        setRepository(repoResponse.data);
        
        // Then fetch the issue details
        const issueResponse = await repositoryService.getIssue(username, reponame, issueid);
        setIssue(issueResponse);
        
        // Set user's vote if authenticated
        if (issueResponse.user_vote !== undefined) {
          setUserVote(issueResponse.user_vote);
        }
        
      } catch (err) {
        console.error('Error fetching issue:', err);
        if (err.response && err.response.status === 404) {
          setError('Issue not found');
        } else {
          setError('Failed to load issue details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, reponame, issueid]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'MMM d, yyyy, h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleVote = async (voteValue) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // If user is clicking on their current vote, remove it
      if (userVote === voteValue) {
        await repositoryService.removeIssueVote(username, reponame, issueid);
        setUserVote(0);
        setIssue(prev => ({
          ...prev,
          vote_count: prev.vote_count - voteValue
        }));
      } else {
        // Otherwise submit a new vote
        const oldVote = userVote; // Store previous vote to calculate new count
        await repositoryService.voteOnIssue(username, reponame, issueid, { vote: voteValue });
        setUserVote(voteValue);
        
        // Adjust vote count based on previous vote
        const adjustment = oldVote !== 0 ? -oldVote + voteValue : voteValue;
        setIssue(prev => ({
          ...prev,
          vote_count: prev.vote_count + adjustment
        }));
      }
    } catch (err) {
      console.error('Error voting on issue:', err);
      setError('Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleIssueStatus = async () => {
    if (!isAuthenticated || !repository || repository.owner_id !== user?.id) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Call API to update issue status
      const response = await repositoryService.updateIssueStatus(username, reponame, issueid, {
        is_open: !issue.is_open
      });
      
      // If we got a response back, use that data
      if (response) {
        setIssue(response);
      } else {
        // Fallback to updating local state if no response
        setIssue(prev => ({
          ...prev,
          is_open: !prev.is_open,
          closed_at: prev.is_open ? new Date().toISOString() : null,
          closed_by: prev.is_open ? user.username : null
        }));
      }
      
    } catch (err) {
      console.error('Error updating issue status:', err);
      setError('Failed to update issue status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if the current user is the repository owner
  const isRepoOwner = () => {
    return isAuthenticated && user && repository && repository.owner_id === user.id;
  };

  if (loading) {
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

  if (!issue || !repository) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600">Issue not found</p>
        <Link to={`/${username}/${reponame}/issues`} className="mt-4 inline-block text-blue-600 hover:underline">
          Back to issues
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to={`/${username}/${reponame}/issues`} className="text-blue-600 hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to issues
        </Link>
      </div>
      
      <div className="bg-gh-dark-bg-secondary rounded-lg shadow-md overflow-hidden border border-gh-dark-border-primary">
        <div className="p-6 border-b border-gh-dark-border-primary">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className={`inline-block w-3 h-3 rounded-full ${issue.is_open ? 'bg-gh-dark-accent-blue' : 'bg-gh-dark-accent-red'}`}></span>
                <span className="text-sm font-medium">
                  {issue.is_open ? 'Open' : 'Closed'}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-2">{issue.title}</h1>
              <div className="text-sm text-gray-600">
                <span>
                  Opened by <Link to={`/${issue.created_by}`} className="text-blue-600 hover:underline">{issue.created_by}</Link> on {formatDate(issue.created_at)}
                </span>
                {!issue.is_open && issue.closed_at && (
                  <span className="ml-3">
                    • Closed by {issue.closed_by && typeof issue.closed_by === 'object' && issue.closed_by.Valid 
                      ? <Link to={`/${issue.closed_by.String}`} className="text-gh-dark-accent-blue hover:underline">{issue.closed_by.String}</Link>
                      : typeof issue.closed_by === 'string'
                        ? <Link to={`/${issue.closed_by}`} className="text-gh-dark-accent-blue hover:underline">{issue.closed_by}</Link>
                        : <span>unknown user</span>
                    } on {formatDate(issue.closed_at)}
                  </span>
                )}
              </div>
            </div>
            
            {isRepoOwner() && (
              <button
                onClick={toggleIssueStatus}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md text-white ${
                  issue.is_open 
                    ? 'bg-gh-dark-accent-red hover:opacity-90' 
                    : 'bg-gh-dark-accent-blue hover:opacity-90'
                } ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {issue.is_open ? 'Close issue' : 'Reopen issue'}
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={() => handleVote(1)}
                  disabled={isSubmitting}
                  className={`p-1 rounded ${userVote === 1 ? 'bg-gh-dark-accent-blue bg-opacity-20 text-gh-dark-accent-blue' : 'hover:bg-gh-dark-bg-tertiary'}`}
                  title="Upvote"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className="font-medium">{issue.vote_count || 0}</span>
                <button
                  onClick={() => handleVote(-1)}
                  disabled={isSubmitting}
                  className={`p-1 rounded ${userVote === -1 ? 'bg-gh-dark-accent-red bg-opacity-20 text-gh-dark-accent-red' : 'hover:bg-gh-dark-bg-tertiary'}`}
                  title="Downvote"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-grow">
              <div className="prose max-w-none">
                {issue.description ? (
                  <p className="whitespace-pre-wrap">{issue.description}</p>
                ) : (
                  <p className="text-gh-dark-text-secondary italic">No description provided.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IssueDetailPage;
