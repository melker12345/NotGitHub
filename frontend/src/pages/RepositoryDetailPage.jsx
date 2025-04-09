import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import repositoryService from '../services/repositoryService';
import repositoryBrowserService from '../services/repositoryBrowserService';
import FileBrowser from '../components/repositories/FileBrowser';

function RepositoryDetailPage() {
  const { username, reponame } = useParams();
  const navigate = useNavigate();
  const [repository, setRepository] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [hasFiles, setHasFiles] = useState(false);

  useEffect(() => {
    const fetchRepository = async () => {
      try {
        setIsLoading(true);
        const data = await repositoryService.getRepositoryByPath(username, reponame);
        setRepository(data);
        
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
        setError('Failed to load repository');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepository();
  }, [username, reponame]);

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
      {/* Repository Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{repository.name}</h1>
            {repository.description && (
              <p className="mt-2 text-gray-600">{repository.description}</p>
            )}
            <div className="mt-3 flex items-center space-x-4">
              <span className={`px-2 py-1 text-xs rounded ${repository.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {repository.is_public ? 'Public' : 'Private'}
              </span>
              <span className="text-sm text-gray-500">
                Created on {new Date(repository.created_at).toLocaleDateString()}
              </span>
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
            <Link
              to={`/${username}/${reponame}/settings`}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
            >
              Settings
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Clone Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Clone Repository</h2>
        
        <div className="space-y-4">
          {/* HTTPS Clone */}
          <div>
            <h3 className="text-md font-medium mb-2">HTTPS</h3>
            <div className="flex items-center">
              <div className="flex-grow bg-gray-100 rounded-md p-3 font-mono text-sm overflow-x-auto">
                {httpsCloneUrl}
              </div>
              <button 
                onClick={() => copyToClipboard(httpsCloneUrl)}
                className="ml-2 p-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* SSH Clone */}
          <div>
            <h3 className="text-md font-medium mb-2">SSH</h3>
            <div className="flex items-center">
              <div className="flex-grow bg-gray-100 rounded-md p-3 font-mono text-sm overflow-x-auto">
                {sshCloneUrl}
              </div>
              <button 
                onClick={() => copyToClipboard(sshCloneUrl)}
                className="ml-2 p-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Don't forget to <Link to="/profile/ssh-keys" className="text-blue-600 hover:underline">add your SSH key</Link> before using SSH to clone.
            </p>
          </div>
          
          {copySuccess && (
            <div className="mt-2 text-sm text-green-600 font-medium">
              {copySuccess}
            </div>
          )}
        </div>
      </div>

      {/* Repository Files */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Repository Files</h2>
        <div className="bg-gray-100 p-8 rounded-md">
          <h3 className="text-lg font-medium mb-4">Quick setup — if you've done this kind of thing before</h3>
          
          <div className="flex items-center mb-6">
            <div className="flex-grow bg-gray-200 rounded-md p-3 font-mono text-sm overflow-x-auto">
              {httpsCloneUrl}
            </div>
            <button 
              onClick={() => copyToClipboard(httpsCloneUrl)}
              className="ml-2 p-2 bg-gray-300 hover:bg-gray-400 rounded-md"
              title="Copy to clipboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </button>
          </div>
          
          {!hasFiles ? (
            <>
              <p className="mb-6">
                Get started by creating a new file or uploading an existing file. We recommend every repository include a README, LICENSE, and .gitignore.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">…or create a new repository on the command line</h4>
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
                  <h4 className="font-medium mb-2">…or push an existing repository from the command line</h4>
                  <div className="bg-gray-200 p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-x-auto">
{`git remote add origin ${httpsCloneUrl}
git branch -M main
git push -u origin main`}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">…or clone using SSH</h4>
                  <div className="bg-gray-200 p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-x-auto">
{`git clone ${sshCloneUrl}
cd ${repository.name}`}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Don't forget to <Link to="/ssh-keys" className="text-blue-600 hover:underline">add your SSH key</Link> before using SSH to clone.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Repository Files</h2>
              <div className="bg-white p-4 rounded-lg shadow">
                <FileBrowser username={username} reponame={reponame} />
              </div>
            </div>
          )}
          
          {!hasFiles && (
            <div className="mt-6 flex justify-center">
              <Link
                to={`/${username}/${reponame}/browser`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Browse Repository Files
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
    </div>
  );
}

export default RepositoryDetailPage;
