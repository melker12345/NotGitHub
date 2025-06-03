import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import repositoryBrowserService from '../../services/repositoryBrowserService';
import repositoryService from '../../services/repositoryService';
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';

// Import additional languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

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
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const currentPath = searchParams.get('path') || '';

  const params = useParams();
  const username = propUsername || params.username;
  const reponameProp = propReponame || params.reponame; // Renamed to avoid conflict with state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRepoData = async () => {
      if (!username || !reponameProp) return;
      try {
        const data = await repositoryService.getRepositoryByPath(username, reponameProp);
        setRepository(data);
      } catch (err) {
        console.error('Error fetching repository:', err);
        setError('Failed to fetch repository details.');
      }
    };
    fetchRepoData();
  }, [username, reponameProp]);

  const fetchContents = useCallback(async () => {
    if (!username || !reponameProp) return;
    // console.log(`Fetching contents for: ${username}/${reponameProp}, path: '${currentPath}'`);
    setIsLoading(true);
    setError('');
    try {
      const response = await repositoryBrowserService.getContentsByPath(username, reponameProp, currentPath);
      if (response && Array.isArray(response)) {
        const processedContents = response.map(item => ({
          ...item,
          Name: item.name || item.Name,
          Path: (item.path || item.Path || '').replace(/\\/g, '/'), // Normalize path separators
          Type: item.type || item.Type,
        }));
        setContents(processedContents);
        setCurrentDirectory({
          name: currentPath.split('/').pop() || reponameProp,
          path: currentPath,
        });
      } else {
        throw new Error('Invalid response format for contents.');
      }
    } catch (err) {
      console.error('Error fetching contents:', err);
      setError('Failed to load repository contents: ' + (err.message || 'Unknown error'));
      setContents([]);
    } finally {
      setIsLoading(false);
    }
  }, [username, reponameProp, currentPath]); // Removed navigate from deps as it's stable

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  // New useEffect to load README.md by default
  useEffect(() => {
    if (contents.length > 0 && !selectedFile && currentPath === '') {
      const readmeFile = contents.find(
        (item) => item.Type === 'file' && item.Name.toLowerCase() === 'readme.md'
      );

      if (readmeFile) {
        const loadReadme = async () => {
          setIsLoading(true);
          setError('');
          try {
            const fileData = await repositoryBrowserService.getFileContentByPath(
              username,
              reponameProp,
              readmeFile.Path
            );
            setSelectedFile({
              ...readmeFile,
              Content: fileData.content,
              language: 'markdown', // Explicitly set language for README.md
              size: fileData.size !== undefined ? fileData.size : (readmeFile.Size || readmeFile.size || 0),
              last_commit: fileData.last_commit || readmeFile.last_commit || (readmeFile.LastCommit || readmeFile.lastCommit),
            });
            setTimeout(() => Prism.highlightAll(), 0);
          } catch (err) {
            console.error('Error fetching README.md content:', err);
            setError('Failed to load README.md content: ' + (err.message || 'Unknown error'));
          } finally {
            setIsLoading(false);
          }
        };
        loadReadme();
      } else {
        setIsLoading(false); // If no README.md, stop loading
      }
    } else if (contents.length === 0 && currentPath === '') {
      // If no contents at all in root, and not already loading, stop loading
      setIsLoading(false);
    }
  }, [contents, username, reponameProp, currentPath, selectedFile]); // Added selectedFile to dependencies // Depends only on the memoized fetchContents

  const handleNavigate = useCallback((path) => {
    const cleanPath = path.replace(/\\/g, '/').trim();
    // console.log('Navigating to folder:', cleanPath);
    setSelectedFile(null);
    setError('');
    // No need to set currentDirectory here, URL change will trigger fetchContents which updates it
    navigate(`/${username}/${reponameProp}/browser?path=${encodeURIComponent(cleanPath)}`);
  }, [username, reponameProp, navigate]);

  const getLanguage = useCallback((filename) => {
    if (!filename) return 'text';
    const extension = filename.split('.').pop().toLowerCase();
    const languageMap = {
      js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
      py: 'python', html: 'html', css: 'css', scss: 'scss',
      json: 'json', md: 'markdown', go: 'go', sh: 'bash',
      bash: 'bash', yml: 'yaml', yaml: 'yaml', java: 'java',
      c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp',
    };
    return languageMap[extension] || 'text';
  }, []);

  const handleFileSelect = useCallback(async (file) => {
    const filePath = (file.Path || file.path || '').replace(/\\/g, '/');
    const fileName = file.Name || file.name || '';
    if (!filePath) {
      console.error('File path is undefined for file:', fileName, file);
      setError(`Cannot select file '${fileName}': path is missing.`);
      return;
    }
    // console.log('Selecting file:', filePath);
    setIsLoading(true);
    setError('');
    try {
      const fileData = await repositoryBrowserService.getFileContentByPath(username, reponameProp, filePath);
      const language = getLanguage(fileName);
      setSelectedFile({
        ...file,
        Name: fileName,
        Path: filePath,
        Content: fileData.content,
        language: language,
        size: fileData.size !== undefined ? fileData.size : (file.Size || file.size || 0),
        last_commit: fileData.last_commit || file.last_commit || (file.LastCommit || file.lastCommit),
      });
      setTimeout(() => Prism.highlightAll(), 0);
    } catch (err) {
      console.error(`Error fetching file content for ${fileName}:`, err);
      setError(`Failed to load file: ${fileName}. ` + (err.message || 'Unknown error'));
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
    }
  }, [username, reponameProp, getLanguage]); // Removed setIsLoading from deps as it's a setter

  const generateBreadcrumbs = useCallback(() => {
    const pathSegments = currentPath.split('/').filter(Boolean);
    const crumbs = [{ name: reponameProp || 'Root', path: '' }];
    let currentCrumbPath = '';
    pathSegments.forEach(segment => {
      currentCrumbPath = currentCrumbPath ? `${currentCrumbPath}/${segment}` : segment;
      crumbs.push({ name: segment, path: currentCrumbPath });
    });
    return crumbs;
  }, [currentPath, reponameProp]);

  const breadcrumbs = generateBreadcrumbs();

  // Sort contents: directories first, then files, alphabetically
  const sortedContents = [...(contents || [])].sort((a, b) => {
    const aType = a.Type || a.type;
    const bType = b.Type || b.type;
    if (aType === 'dir' && bType !== 'dir') return -1;
    if (aType !== 'dir' && bType === 'dir') return 1;
    return (a.Name || a.name).localeCompare(b.Name || b.name);
  });

  return (
    <div className="h-screen flex flex-col text-gh-dark-text-primary bg-gh-dark-bg-primary">
      {/* Top Bar */}
      <div className="flex-shrink-0 p-3 border-b border-gh-dark-border-primary shadow-sm bg-gh-dark-bg-secondary space-y-2">
        {repository && (
          <div className="flex items-center space-x-2 text-base">
            <Link to={`/${username}/${reponameProp}`} className="font-semibold text-gh-dark-accent-blue hover:underline">
              {reponameProp}
            </Link>
            <span className="text-gh-dark-text-muted">/</span>
            <span className="text-gh-dark-text-primary">Files</span>
            {currentPath && (
              <>
                <span className="text-gh-dark-text-muted">/</span>
                <span className="text-gh-dark-text-primary font-mono text-xs bg-gh-dark-bg-tertiary px-1.5 py-0.5 rounded">{currentPath}</span>
              </>
            )}
          </div>
        )}
        <div className="flex items-center text-xs text-gh-dark-text-secondary overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gh-dark-bg-tertiary scrollbar-track-gh-dark-bg-secondary">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path + '-' + index} className="flex items-center flex-shrink-0">
              {index > 0 && <span className="mx-1.5 text-gh-dark-text-muted">/</span>}
              <button
                onClick={() => handleNavigate(crumb.path)}
                className="hover:text-gh-dark-accent-blue hover:underline focus:outline-none"
                title={crumb.name}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex overflow-hidden">
        {/* Left Sidebar: Directory Listing */}
        <div className="w-1/3 md:w-1/4 lg:w-1/5 p-3 border-r border-gh-dark-border-primary overflow-y-auto bg-gh-dark-bg-secondary flex-shrink-0">
          {isLoading && !contents.length ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gh-dark-accent-blue"></div>
            </div>
          ) : error && !contents.length ? (
            <div className="p-4 text-center text-gh-dark-text-negative text-sm">
              <p>{error}</p>
              <button
                onClick={fetchContents} 
                className="mt-2 px-3 py-1 bg-gh-dark-accent-blue text-gh-dark-text-primary rounded hover:bg-gh-dark-accent-blue-hover text-xs"
              >
                Retry
              </button>
            </div>
          ) : sortedContents.length === 0 && !currentPath && !isLoading ? (
             <div className="p-4 text-center text-gh-dark-text-muted text-sm">
                This repository appears to be empty.
              </div>
          ) : sortedContents.length === 0 && currentPath && !isLoading ? (
             <div className="p-4 text-center text-gh-dark-text-muted text-sm">
                This directory is empty.
              </div>
          ): (
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gh-dark-bg-secondary z-10">
                <tr>
                  <th className="py-2 px-2 text-left text-xs font-medium text-gh-dark-text-secondary uppercase tracking-wider border-b border-gh-dark-border-secondary">Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gh-dark-border-primary">
                {currentPath && (
                  <tr className="hover:bg-gh-dark-bg-hover transition-colors duration-150">
                    <td className="py-1.5 px-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          const pathSegments = currentPath.split('/').filter(Boolean);
                          pathSegments.pop();
                          handleNavigate(pathSegments.join('/'));
                        }}
                        className="flex items-center text-gh-dark-text-primary hover:text-gh-dark-accent-blue w-full"
                        title="Go to parent directory"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gh-dark-icon flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        ..
                      </button>
                    </td>
                  </tr>
                )}
                {sortedContents.map((item, index) => (
                  <tr key={(item.Path || `${item.Name}-${index}`)} className="hover:bg-gh-dark-bg-hover transition-colors duration-150">
                    <td className="py-1.5 px-2 whitespace-nowrap truncate">
                      {(item.Type === 'dir') ? (
                        <button
                          onClick={() => handleNavigate(item.Path)}
                          className="flex items-center text-gh-dark-text-primary hover:text-gh-dark-accent-blue w-full"
                          title={item.Name}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gh-dark-accent-blue flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span className="truncate">{item.Name}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFileSelect(item)}
                          className={`flex items-center w-full ${(selectedFile && selectedFile.Path === item.Path) ? 'text-gh-dark-accent-green font-semibold' : 'text-gh-dark-text-secondary hover:text-gh-dark-text-primary'}`}
                          title={item.Name}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gh-dark-icon flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="truncate">{item.Name}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Main Panel: File Content / Directory Info */}
        <div className="flex-grow overflow-y-auto">
          {isLoading && selectedFile ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gh-dark-accent-blue"></div>
            </div>
          ) : selectedFile ? (
            <div className="h-full flex flex-col bg-gh-dark-card-bg shadow-lg rounded-md border border-gh-dark-border-secondary">
              <div className="flex-shrink-0 p-3 border-b border-gh-dark-border-secondary bg-gh-dark-bg-secondary rounded-t-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base truncate flex items-center text-gh-dark-text-primary" title={selectedFile.Name}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gh-dark-icon flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate">{selectedFile.Name}</span>
                  </h3>
                  <span className="text-sm bg-gh-dark-bg-tertiary text-gh-dark-text-primary px-2 py-1 rounded-full font-mono">{formatFileSize(selectedFile.size || selectedFile.Size || 0)}</span>
                </div>
                {(selectedFile.last_commit || selectedFile.LastCommit) && (
                  <div className="text-xs text-gh-dark-text-muted mt-2 bg-gh-dark-bg-secondary p-2 rounded-md">
                    <span className="font-medium">Last modified by:</span> {(selectedFile.last_commit && selectedFile.last_commit.author) || (selectedFile.LastCommit && selectedFile.LastCommit.Author) || 'Unknown'} <br />
                    <span className="font-medium">Date:</span> {
                      formatDate((selectedFile.last_commit && selectedFile.last_commit.timestamp) || 
                               (selectedFile.LastCommit && selectedFile.LastCommit.Timestamp) || 
                               new Date())}
                  </div>
                )}
              </div>
              <div className="flex-grow overflow-auto bg-gh-dark-bg-primary">
                <div className="bg-gh-dark-card-bg shadow-xl rounded-lg border border-gh-dark-border-secondary p-4 md:p-6 mx-auto w-full">
                  <pre className="text-sm font-mono whitespace-pre-wrap bg-gh-dark-bg-secondary p-4 rounded-md border border-gh-dark-border-secondary overflow-x-auto text-gh-dark-text-primary shadow-inner">
                  <code className={`language-${selectedFile.language || 'text'}`}>
                    {selectedFile.content || selectedFile.Content || ''}
                  </code>
                  </pre>
                </div>
              </div>
            </div>
          ) : currentDirectory ? (
            <div className="h-full flex flex-col">
              <div className="bg-gh-dark-bg-secondary px-4 py-2 border-b border-gh-dark-border-secondary">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate text-gh-dark-text-primary">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gh-dark-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      {currentDirectory.name || 'Repository Root'}
                    </div>
                  </h3>
                </div>
              </div>
              <div className="flex-grow p-4 md:p-6 overflow-auto bg-gh-dark-bg-primary">
                <div className="bg-gh-dark-card-bg shadow-xl rounded-lg border border-gh-dark-border-secondary p-4 md:p-6 mx-auto w-full">
                  <div className="mb-4 text-sm text-gh-dark-text-muted bg-gh-dark-bg-secondary p-3 rounded border border-gh-dark-border-secondary">
                    <p>Viewing directory contents. Select a file to view its contents or click on a folder to navigate into it.</p>
                  </div>
                
                <div className="mt-2">
                  <h4 className="text-sm font-medium text-gh-dark-text-primary mb-2">Directory Information:</h4>
                  <div className="bg-gh-dark-bg-secondary p-3 rounded-md text-sm text-gh-dark-text-primary border border-gh-dark-border-secondary">
                    <p><span className="font-medium">Path:</span> /{currentDirectory.path || ''}</p>
                    <p><span className="font-medium">Items:</span> {contents.length}</p>
                    <p><span className="font-medium">Files:</span> {contents.filter(item => (item.type === 'file' || item.Type === 'file')).length}</p>
                    <p><span className="font-medium">Folders:</span> {contents.filter(item => (item.type === 'dir' || item.Type === 'dir')).length}</p>
                  </div>
                  </div> {/* Closes div from line 577 (mt-2) */}
                </div>      {/* Closes div from line 572 (A4-style paper) */}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gh-dark-text-secondary">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileBrowser;
