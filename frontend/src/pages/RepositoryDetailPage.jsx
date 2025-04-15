import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { repositoryService } from '../services/api';
import repositoryBrowserService from '../services/repositoryBrowserService';
import FileBrowser from '../components/repositories/FileBrowser';
import RepositoryVisibilityBadge from '../components/RepositoryVisibilityBadge';
import { formatDistanceToNow } from 'date-fns';

import { useAuth } from '../contexts/AuthContext';
import { canEditRepository, canDeleteRepository } from '../utils/repositoryAccess';

function RepositoryDetailPage() {
  const { username, reponame } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [repository, setRepository] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [hasFiles, setHasFiles] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const fetchRepository = async () => {
      try {
        setIsLoading(true);
        const response = await repositoryService.getRepositoryByPath(username, reponame);
        const data = response.data;
        setRepository(data);
        
        // Check permissions based on repository ownership and visibility
        const ownerCheck = isAuthenticated && user && data.owner_id === user.id;
        setIsOwner(ownerCheck);
        setCanEdit(canEditRepository(data, user));
        setCanDelete(canDeleteRepository(data, user));
        
        // Check if repository has files
        try {
          const contents = await repositoryBrowserService.getContentsByPath(username, reponame);
          // If we got contents and there are items, the repository has files
          setHasFiles(Array.isArray(contents) && contents.length > 0);
        } catch (contentErr) {
          console.error('Error checking repository contents:', contentErr);
          setHasFiles(false);
        }
        
        setError('');
      } catch (err) {
        console.error('Error fetching repository:', err);
        if (err.response && err.response.status === 404) {
          setError('Repository not found');
        } else if (err.response && err.response.status === 403) {
          setError('You don\'t have permission to access this repository');
        } else {
          setError('Failed to load repository');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepository();
  }, [username, reponame, isAuthenticated, user]);

  const handleDelete = async () => {
    try {
      await repositoryService.deleteRepositoryByPath(username, reponame);
      navigate('/');
    } catch (err) {
      console.error('Error deleting repository:', err);
      setError('Failed to delete repository');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      },
      () => {
        setCopySuccess('Failed to copy');
      }
    );
  };

  if (isLoading) {
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

  if (!repository) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600">Repository not found</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to repositories
        </Link>
      </div>
    );
  }

  // Safely get clone URLs
  const { https: httpsCloneUrl, ssh: sshCloneUrl } = repositoryService.getCloneUrls(repository);

  return (
    <div className="space-y-6">
      {copySuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded fixed top-4 right-4 shadow-md">
          {copySuccess}
        </div>
      )}

      {/* Repository Files */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Repository Files</h2>
        <div className="bg-gray-100 p-6 rounded-md">
          <h3 className="text-lg font-medium mb-4">Quick setup</h3>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex items-center">
              <div className="flex-grow bg-gray-200 rounded-md p-3 font-mono text-sm overflow-x-auto">
                <span className="font-medium text-gray-600 mr-2">HTTPS:</span>
                {httpsCloneUrl}
              </div>
              <button 
                onClick={() => copyToClipboard(httpsCloneUrl)}
                className="ml-2 p-2 bg-gray-300 hover:bg-gray-400 rounded-md"
                title="Copy HTTPS URL"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center">
              <div className="flex-grow bg-gray-200 rounded-md p-3 font-mono text-sm overflow-x-auto">
                <span className="font-medium text-gray-600 mr-2">SSH:</span>
                {sshCloneUrl}
              </div>
              <button 
                onClick={() => copyToClipboard(sshCloneUrl)}
                className="ml-2 p-2 bg-gray-300 hover:bg-gray-400 rounded-md"
                title="Copy SSH URL"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Show setup instructions only for empty repositories and only for owners */}
          {!hasFiles && isOwner ? (
            <>
              <p className="mb-6">
                Get started by creating a new file or uploading an existing file. We recommend every repository include a README, LICENSE, and .gitignore.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Create a new repository on the command line</h4>
                  <div className="bg-gray-200 p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-x-auto">
{`echo "# ${repository.name}" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin ${httpsCloneUrl}
git push -u origin main`}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Push an existing repository from the command line</h4>
                  <div className="bg-gray-200 p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-x-auto">
{`git remote add origin ${httpsCloneUrl}
git branch -M main
git push -u origin main`}
                  </div>
                </div>
              </div>
            </>
          ) : null}
          
          {/* Always show clone instructions for all users */}
          <div className="space-y-6 mt-6">
            <div>
              <h4 className="font-medium mb-2">Clone this repository</h4>
              
              <div className="bg-gray-200 p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-x-auto mb-4">
                <p className="font-medium mb-2">HTTPS</p>
{`git clone ${httpsCloneUrl}
cd ${repository.name}`}
              </div>
              
              <div className="bg-gray-200 p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                <p className="font-medium mb-2">SSH</p>
{`git clone ${sshCloneUrl}
cd ${repository.name}`}
              </div>
              
              <p className="mt-2 text-sm text-gray-600">
                {isAuthenticated ? (
                  <>
                    Don't forget to <Link to="/profile/ssh-keys" className="text-blue-600 hover:underline">add your SSH key</Link> before using SSH to clone.
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-blue-600 hover:underline">Log in</Link> to add SSH keys for SSH cloning.
                  </>
                )}
              </p>
            </div>
          </div>
          
          {/* File browser */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Repository Contents</h3>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              {hasFiles ? (
                <FileBrowser username={username} reponame={reponame} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>This repository is empty</p>
                  {isOwner && (
                    <p className="mt-2 text-sm">
                      Use the instructions above to add files to your repository
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Always show repository files, whether empty or not */}
        </div>
      </div>

      {/* Repository Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 mr-3">{repository.name}</h1>
              <RepositoryVisibilityBadge isPublic={repository.is_public} />
            </div>
            {repository.description && (
              <p className="mt-2 text-gray-600">{repository.description}</p>
            )}
            <div className="mt-3 flex items-center space-x-4">
              <Link to={`/${repository.owner.username}`} className="text-blue-600 hover:underline">
                {repository.owner.username}
              </Link>
              <span className="text-sm text-gray-500">
                Created {formatDistanceToNow(new Date(repository.created_at), { addSuffix: true })}
              </span>
              {repository.updated_at && repository.updated_at !== repository.created_at && (
                <span className="text-sm text-gray-500">
                  Updated {formatDistanceToNow(new Date(repository.updated_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/${username}/${reponame}/browser`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Browse Files
            </Link>
            
            {/* Only show settings link if user can edit */}
            {canEdit && (
              <Link
                to={`/${username}/${reponame}/settings`}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
              >
                Settings
              </Link>
            )}
            
            {/* Only show delete button if user can delete */}
            {canDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - Only shown to users with delete permissions */}
      {canDelete && showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Delete Repository</h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete <span className="font-semibold">{repository.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Unauthorized Access Modal - Shown when non-authenticated users try to perform restricted actions */}
      {!isAuthenticated && showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
            <p className="mb-6 text-gray-700">
              You need to be logged in to perform this action.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Cancel
              </button>
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md inline-block"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepositoryDetailPage;
