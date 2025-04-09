import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import repositoryBrowserService from '../../services/repositoryBrowserService';
import repositoryService from '../../services/repositoryService';

// Format file size in a human-readable way
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date in a human-readable way
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

function FileBrowser({ username: propUsername, reponame: propReponame }) {
  const [contents, setContents] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [repository, setRepository] = useState(null);
  const currentPath = searchParams.get('path') || '';
  // Use props if provided, otherwise fall back to URL params
  const params = useParams();
  const username = propUsername || params.username;
  const reponame = propReponame || params.reponame;
  const navigate = useNavigate();

  // Fetch the repository name for display in breadcrumbs
  useEffect(() => {
    const fetchRepository = async () => {
      try {
        const data = await repositoryService.getRepositoryByPath(username, reponame);
        setRepository(data);
      } catch (err) {
        console.error('Error fetching repository:', err);
      }
    };

    fetchRepository();
  }, [username, reponame]);

  // Fetch repository contents
  useEffect(() => {
    const fetchContents = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Fetch contents using GitHub-style URL pattern
        const response = await repositoryBrowserService.getContentsByPath(username, reponame, currentPath);
        
        if (response && Array.isArray(response)) {
          setContents(response);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching contents:', err);
        setError('Failed to load repository contents');
        setContents([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (username && reponame) {
      fetchContents();
    }
  }, [username, reponame, currentPath]);

  // Handle directory navigation
  const handleNavigate = (path) => {
    navigate(`/${username}/${reponame}/browser?path=${encodeURIComponent(path)}`);
  };

  // Handle file selection
  const handleFileSelect = async (file) => {
    try {
      const fileData = await repositoryBrowserService.getFileContentByPath(username, reponame, file.Path);
      setSelectedFile(fileData);
    } catch (err) {
      console.error('Error fetching file content:', err);
      setError('Failed to load file content');
    }
  };

  // Build breadcrumb navigation
  const generateBreadcrumbs = () => {
    if (!currentPath) {
      return [{ name: 'root', path: '' }];
    }

    const parts = currentPath.split('/');
    let breadcrumbs = [{ name: 'root', path: '' }];
    
    let path = '';
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      path += (path ? '/' : '') + parts[i];
      breadcrumbs.push({ name: parts[i], path });
    }
    
    return breadcrumbs;
  };

  if (isLoading && !repository) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error && !contents.length && !repository) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="flex flex-col space-y-4">
      {repository && (
        <div className="flex items-center space-x-2 mb-4">
          <Link to={`/${username}/${reponame}`} className="hover:underline">
            {reponame}
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-700">Files</span>
          {currentPath && (
            <>
              <span className="text-gray-500">/</span>
              <span className="text-gray-700">{currentPath}</span>
            </>
          )}
        </div>
      )}

      {/* Breadcrumb navigation */}
      <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            <button
              onClick={() => handleNavigate(crumb.path)}
              className="hover:text-blue-600 hover:underline"
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* Repository contents */}
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        {/* Directory listing */}
        <div className="w-full md:w-1/2 bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : contents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {error || "This repository is empty"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Commit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contents.map((item) => (
                    <tr key={item.Path} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.Type === 'dir' ? (
                          <button
                            onClick={() => handleNavigate(item.Path)}
                            className="flex items-center text-blue-600 hover:underline"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            {item.Name}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFileSelect(item)}
                            className="flex items-center hover:text-blue-600 hover:underline"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {item.Name}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.LastCommit ? (
                          <div className="flex flex-col">
                            <span className="truncate" style={{ maxWidth: '200px' }}>
                              {item.LastCommit.Message}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(item.LastCommit.Timestamp)}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.Type === 'file' ? formatFileSize(item.Size) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* File preview */}
        <div className="w-full md:w-1/2 bg-white shadow rounded-lg overflow-hidden">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">{selectedFile.Name}</h3>
                  <span className="text-sm text-gray-500">{formatFileSize(selectedFile.Size)}</span>
                </div>
                {selectedFile.LastCommit && (
                  <div className="text-xs text-gray-500 mt-1">
                    Last modified by {selectedFile.LastCommit.Author} on {formatDate(selectedFile.LastCommit.Timestamp)}
                  </div>
                )}
              </div>
              <div className="flex-grow p-4 overflow-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">{selectedFile.Content}</pre>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileBrowser;
