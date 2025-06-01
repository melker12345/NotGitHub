import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import repositoryBrowserService from '../../services/repositoryBrowserService';
import repositoryService from '../../services/repositoryService';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';

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

  // Function to fetch repository contents on component mount and URL changes
  const fetchContents = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // IMPORTANT: For debugging
      // console.log(`*** FETCHING CONTENTS FOR ${username}/${reponame}, path: '${currentPath}'`);
      
      // Fetch contents using GitHub-style URL pattern - currentPath comes from URL
      const response = await repositoryBrowserService.getContentsByPath(username, reponame, currentPath);
      
      // Log complete response for debugging
      // console.log('API RESPONSE:', JSON.stringify(response, null, 2));
      
      if (response && Array.isArray(response)) {
        // Process contents with path fixing to handle backend path duplication issue
        const processedContents = response.map(item => {
          // Fix the backend path duplication issue (e.g., "src\src")
          let fixedPath = item.path || '';
          const name = item.name || '';
          
          // Check for Windows-style path duplication and fix it
          if (fixedPath.includes('\\') && fixedPath.includes(`${name}\\${name}`)) {
            console.log(`Fixing duplicated path: ${fixedPath}`);
            // For Windows-style paths (backslashes)
            fixedPath = fixedPath.replace(`${name}\\${name}`, name);
          } 
          // Check for Unix-style path duplication
          else if (fixedPath.includes('/') && fixedPath.includes(`${name}/${name}`)) {
            console.log(`Fixing duplicated path: ${fixedPath}`);
            // For Unix-style paths (forward slashes) 
            fixedPath = fixedPath.replace(`${name}/${name}`, name);
          }
          
          return {
            // Keep original properties
            ...item,
            // Ensure consistent capitalization for key properties used in UI
            Name: item.name || item.Name,
            Path: fixedPath, // Use the fixed path
            Type: item.type || item.Type
          };
        });
        
        // Update the contents state
        setContents(processedContents);
        // console.log('PROCESSED CONTENTS:', processedContents);
        
        // Update current directory based on path from URL
        if (currentPath) {
          setCurrentDirectory({
            name: currentPath.split('/').pop() || reponame,
            path: currentPath
          });
        } else {
          setCurrentDirectory({
            name: reponame,
            path: ''
          });
        }
      } else {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching contents:', err);
      setError('Failed to load repository contents: ' + (err.message || 'Unknown error'));
      setContents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Call fetchContents when component mounts or path changes
  useEffect(() => {
    if (username && reponame) {
      // console.log('Path changed, fetching contents for:', currentPath);
      fetchContents();
      
      // Initialize current directory based on path
      if (currentPath) {
        setCurrentDirectory({
          name: currentPath.split('/').pop() || reponame,
          path: currentPath
        });
      } else {
        setCurrentDirectory({
          name: reponame,
          path: ''
        });
      }
    }
  }, [username, reponame, currentPath]);

  // Direct folder navigation handler
  const handleNavigate = (path) => {
    // CRITICAL: Clean the path to ensure consistent format
    const cleanPath = path.replace(/\\/g, '/').trim();
    
    console.log('*** NAVIGATING TO FOLDER:', cleanPath);
    
    // Reset state for new navigation
    setSelectedFile(null);
    setError('');
    
    // Update current directory tracking
    const dirName = cleanPath.split('/').pop() || reponame;
    setCurrentDirectory({
      name: dirName,
      path: cleanPath
    });
    
    // Update the URL - this will trigger the useEffect that fetches contents
    navigate(`/${username}/${reponame}/browser?path=${encodeURIComponent(cleanPath)}`);
    
    // IMPORTANT: Directly fetch contents as a backup in case the effect doesn't trigger
    // This ensures we always get the folder contents even if React has optimized away the effect
    setTimeout(() => {
      // Only fetch if we're still on the same path (user hasn't navigated away)
      if (cleanPath === currentPath) {
        console.log('Direct fetch for path:', cleanPath);
        fetchContents();
      }
    }, 100);
  };
  


  // Function to determine language for syntax highlighting based on file extension
  const getLanguage = (filename) => {
    if (!filename) return 'text';
    
    const extension = filename.split('.').pop().toLowerCase();
    
    // Map file extensions to Prism language classes
    const languageMap = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      py: 'python',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      md: 'markdown',
      go: 'go',
      sh: 'bash',
      bash: 'bash',
      yml: 'yaml',
      yaml: 'yaml',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      h: 'c',
      hpp: 'cpp',
      // Add more language mappings as needed
    };
    
    return languageMap[extension] || 'text';
  };
  
  // Handle file selection
  const handleFileSelect = async (file) => {
    try {
      console.log('Selecting file:', file);
      setIsLoading(true);
      
      // Check both lowercase and uppercase path properties
      let filePath = file.Path || file.path;
      const fileName = file.Name || file.name || '';
      
      if (!filePath) {
        throw new Error('File path is missing');
      }
      
      // Get the base file name without path
      const fileNameOnly = fileName.split('/').pop().split('\\').pop();
      // console.log(`Full file name: ${fileName}, File name only: ${fileNameOnly}`);
      
      // Advanced path duplication fixes
      // For nested files we need to handle different path patterns
      
      // First, handle prefix duplication like src\src\file.js
      if (currentPath && (filePath.includes('\\') || filePath.includes('/')) && filePath.includes(`${currentPath}\\${currentPath}`) || filePath.includes(`${currentPath}/${currentPath}`)) {
        console.log(`Fixing duplicated directory prefix in path: ${filePath}`);
        
        // Replace both Windows and Unix style path duplicates
        filePath = filePath.replace(`${currentPath}\\${currentPath}`, currentPath);
        filePath = filePath.replace(`${currentPath}/${currentPath}`, currentPath);
      }
      
      // Then fix paths that have doubled-up filenames
      if (filePath.includes(`\\${fileNameOnly}\\${fileNameOnly}`)) {
        console.log(`Fixing Windows-style duplicated filename: ${filePath}`);
        filePath = filePath.replace(`\\${fileNameOnly}\\${fileNameOnly}`, `\\${fileNameOnly}`);
      } else if (filePath.includes(`/${fileNameOnly}/${fileNameOnly}`)) {
        console.log(`Fixing Unix-style duplicated filename: ${filePath}`);
        filePath = filePath.replace(`/${fileNameOnly}/${fileNameOnly}`, `/${fileNameOnly}`);
      }
      
      // Remove any src/src pattern at the beginning
      if (filePath.startsWith('src\\src\\')) {
        console.log('Fixing leading src\\src pattern');
        filePath = filePath.replace('src\\src\\', 'src\\');
      } else if (filePath.startsWith('src/src/')) {
        console.log('Fixing leading src/src pattern');
        filePath = filePath.replace('src/src/', 'src/');
      }
      
      // console.log('Using fixed file path:', filePath);
      // console.log(`Requesting file content: ${username}/${reponame}/${filePath}`);
      
      const fileData = await repositoryBrowserService.getFileContentByPath(username, reponame, filePath);
      // console.log('File content response:', fileData);
      
      // Make sure content is available in the data
      if (!fileData.content && fileData.Content) {
        fileData.content = fileData.Content;
      }
      
      // Determine language for syntax highlighting
      const language = getLanguage(fileNameOnly);
      // console.log(`Detected language for syntax highlighting: ${language}`);
      
      // Set selected file with language information
      setSelectedFile({
        ...fileData,
        language
      });
      
      // Trigger Prism highlighting after component updates
      setTimeout(() => {
        Prism.highlightAll();
      }, 100);
      
    } catch (err) {
      console.error('Error fetching file content:', err);
      setError(`Failed to load file content: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !contents.length && !repository) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="flex flex-col space-y-6 text-gh-dark-text-primary">
      {repository && (
        <div className="flex items-center space-x-2 text-lg text-gh-dark-text-secondary">
          <Link to={`/${username}/${reponame}`} className="font-medium text-gh-dark-accent-blue hover:underline hover:text-gh-dark-accent-blue-hover">
            {reponame}
          </Link>
          <span className="text-gh-dark-text-muted">/</span>
          <span className="text-gh-dark-text-primary">Files</span>
          {currentPath && (
            <>
              <span className="text-gh-dark-text-muted">/</span>
              <span className="text-gh-dark-text-primary font-mono text-sm bg-gh-dark-bg-tertiary px-2 py-0.5 rounded-md">{currentPath}</span>
            </>
          )}
        </div>
      )}

      {/* Breadcrumb navigation */}
      <div className="flex items-center text-sm text-gh-dark-text-secondary bg-gh-dark-bg-secondary px-4 py-2.5 rounded-lg border border-gh-dark-border-primary shadow-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gh-dark-text-muted">/</span>}
            <button
              onClick={() => handleNavigate(crumb.path)}
              className="hover:text-gh-dark-accent-blue hover:underline transition-colors duration-200 px-1 rounded hover:bg-gh-dark-bg-hover"
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* Repository contents */}
      <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
        {/* Directory listing */}
        <div className="w-full md:w-2/5 bg-gh-dark-bg-secondary shadow-md rounded-lg overflow-hidden border border-gh-dark-border-primary">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gh-dark-accent-blue"></div>
            </div>
          ) : (!contents || contents.length === 0) ? (
            <div className="p-6 text-center text-gh-dark-text-muted">
              {error || `No files found in "${currentPath || '/'}" directory. If you've recently pushed files, please refresh.`}
              {username && reponame && (
                <div className="mt-4">
                  <button 
                    onClick={() => fetchContents()} 
                    className="px-4 py-2 bg-gh-dark-accent-blue text-gh-dark-text-primary rounded hover:bg-gh-dark-accent-blue-hover transition-colors duration-200"
                  >
                    Refresh Repository
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gh-dark-bg-secondary sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gh-dark-text-secondary uppercase tracking-wider border-b-2 border-gh-dark-border-primary">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gh-dark-text-secondary uppercase tracking-wider border-b-2 border-gh-dark-border-primary">
                      Last Commit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gh-dark-text-secondary uppercase tracking-wider border-b-2 border-gh-dark-border-primary">
                      Size
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gh-dark-bg-primary divide-y divide-gh-dark-border-secondary">
                  {Array.isArray(contents) && contents.length > 0 ? (
                    contents.map((item, index) => (
                      <tr key={item.path || item.Path || `${item.name || item.Name}-${index}`} className="hover:bg-gh-dark-bg-hover transition-colors duration-150">
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {item.Type === 'dir' || item.type === 'dir' ? (
                            <button
                              onClick={() => {
                                // When a folder is clicked, navigate to its contents
                                const dirName = item.Name || item.name;
                                
                                // CRITICAL: For folders, construct path by appending name to current path
                                // Prevent duplication like "src/src/components"
                                let targetPath;
                                
                                // Remove duplicate paths like "src/src" or backslash variants
                                // This checks if the directory name already includes the current path
                                if (dirName.includes('/') && dirName.startsWith(currentPath + '/')) {
                                  // console.log(`Directory name already contains path: ${dirName}`);
                                  targetPath = dirName;
                                } else if (dirName.includes('\\') && dirName.startsWith(currentPath + '\\')) {
                                  // console.log(`Directory name already contains path: ${dirName}`);
                                  targetPath = dirName;
                                } else {
                                  // Standard path construction without duplication
                                  targetPath = currentPath 
                                    ? `${currentPath}/${dirName}` 
                                    : dirName;
                                }
                                
                                // Clear selected file
                                setSelectedFile(null);
                                
                                // Use React Router navigation to preserve auth state
                                navigate(`/${username}/${reponame}/browser?path=${encodeURIComponent(targetPath)}`);
                                
                                // Prevent the immediate re-fetch and let the URL change trigger the appropriate fetch
                                // This ensures we don't get path conflicts and let React Router handle the navigation properly
                                // DON'T manually fetch contents here - let the useEffect hook handle it
                              }}
                              className="flex items-center text-gh-dark-accent-blue hover:text-gh-dark-accent-blue-hover hover:underline focus:outline-none"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gh-dark-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                              {item.name || item.Name}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                // console.log('Clicking file item:', item);
                                // console.log('File path:', item.path || item.Path);
                                // Explicitly check for path property (case insensitive)
                                if (item.path || item.Path) {
                                  const filePath = item.path || item.Path;
                                  handleFileSelect({...item, Path: filePath, path: filePath});
                                } else {
                                  setError('File path information is missing');
                                }
                              }}
                              className="flex items-center text-gh-dark-text-primary hover:text-gh-dark-accent-blue hover:underline focus:outline-none transition-colors duration-150"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gh-dark-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {item.name || item.Name}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gh-dark-text-secondary">
                          {(item.LastCommit || item.last_commit) ? (
                            <div className="flex flex-col">
                              <span className="truncate text-gh-dark-text-primary" style={{ maxWidth: '200px' }}>
                                {(item.LastCommit && item.LastCommit.Message) || (item.last_commit && item.last_commit.message) || ''}
                              </span>
                              <span className="text-xs text-gh-dark-text-muted">
                                {formatDate((item.LastCommit && item.LastCommit.Timestamp) || (item.last_commit && item.last_commit.timestamp))}
                              </span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gh-dark-text-secondary">
                          {(item.Type === 'file' || item.type === 'file') ? formatFileSize(item.Size || item.size || 0) : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gh-dark-text-muted">
                        No files found in this repository
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* File/Folder preview */}
        <div className="w-full md:w-3/5 bg-gh-dark-bg-primary shadow-md rounded-lg overflow-hidden border border-gh-dark-border-primary">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              <div className="bg-gh-dark-bg-secondary px-4 py-3 border-b border-gh-dark-border-secondary sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate flex items-center text-gh-dark-text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gh-dark-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {selectedFile.name || selectedFile.Name || 'Unnamed file'}
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
              <div className="flex-grow p-5 overflow-auto bg-gh-dark-bg-primary">
                <pre className="text-sm font-mono whitespace-pre-wrap bg-gh-dark-bg-secondary p-4 rounded-md border border-gh-dark-border-secondary overflow-x-auto text-gh-dark-text-primary shadow-inner">
                  <code className={`language-${selectedFile.language || 'text'}`}>
                    {selectedFile.content || selectedFile.Content || ''}
                  </code>
                </pre>
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
              <div className="flex-grow p-4 overflow-auto bg-gh-dark-bg-primary">
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
                </div>
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
