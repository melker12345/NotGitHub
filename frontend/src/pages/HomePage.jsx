import { Link, Navigate } from 'react-router-dom';
import RepositoriesList from '../components/repositories/RepositoriesList';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { repositoryService } from '../services/api';

function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [publicRepos, setPublicRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch public repositories for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(true);
      repositoryService.getPublicRepositories(6, 0, 'newest')
        .then(data => {
          setPublicRepos(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching public repositories:', error);
          setLoading(false);
        });
    }
  }, [isAuthenticated]);

  // Redirect to login page if not authenticated and show welcome content
  if (!isAuthenticated) {
    return (
      <div className="space-y-8">
        {/* Hero Section for non-authenticated users */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:py-16 lg:px-8">
            <div className="lg:flex lg:items-center lg:justify-between">
              <div className="lg:w-0 lg:flex-1">
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Welcome to GitHub Clone!
                </h2>
                <p className="mt-3 max-w-3xl text-lg text-indigo-100">
                  A self-hosted platform for code management and collaboration
                </p>
              </div>
              <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                <div className="inline-flex rounded-md shadow">
                  <Link to="/login" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50">
                    Sign In
                  </Link>
                </div>
                <div className="ml-3 inline-flex rounded-md shadow">
                  <Link to="/register" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600">
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Feature Cards */}
        <section className="grid md:grid-cols-3 gap-6 text-white">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-gray-900 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Manage Repositories</h2>
            </div>
            <p>Create and maintain your code repositories with complete version control and secure access management.</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-gray-900 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Track Issues</h2>
            </div>
            <p >Organize your work with powerful issue tracking and project management tools to keep your team on track.</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-gray-900 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Collaborate Securely</h2>
            </div>
            <p>Work together with team members using SSH authentication and pull requests for seamless collaboration.</p>
          </div>
        </section>
        
        {/* Public Repositories Section */}
        <section className="bg-gray-800 text-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Explore Repositories</h2>
            <Link to="/explore" className="text-blue-600 hover:text-blue-800 font-medium">
              View All
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : publicRepos.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicRepos.map(repo => (
                <div key={repo.id} className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-lg">
                    <Link to={`/${repo.owner_username}/${repo.name}`} className="text-blue-600 hover:underline">
                      {repo.owner_username}/{repo.name}
                    </Link>
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{repo.description || 'No description'}</p>
                  <div className="mt-3 flex items-center text-xs text-gray-400">
                    <span className="mr-3">
                      <span className="font-medium">{repo.stars || 0}</span> stars
                    </span>
                    <span>
                      Updated {new Date(repo.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No public repositories found</p>
          )}
        </section>
      </div>
    );
  }
  
  // For authenticated users, show their homepage with repositories
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:py-16 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-0 lg:flex-1">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Welcome{user ? `, ${user.username}` : ''}!
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-indigo-100">
                Your self-hosted platform for code management and collaboration
              </p>
            </div>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link to="/repositories/new" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Repository
                </Link>
              </div>
              <div className="ml-3 inline-flex rounded-md shadow">
                <Link to="/explore" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Explore
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
 {/* Feature Cards */}
 <section className="grid md:grid-cols-3 gap-6 text-white">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-gray-900 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Manage Repositories</h2>
            </div>
            <p>Create and maintain your code repositories with complete version control and secure access management.</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-gray-900 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Track Issues</h2>
            </div>
            <p >Organize your work with powerful issue tracking and project management tools to keep your team on track.</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-gray-900 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Collaborate Securely</h2>
            </div>
            <p>Work together with team members using SSH authentication and pull requests for seamless collaboration.</p>
          </div>
        </section>
      
      {/* Repositories Section */}
      <section className="bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white ">Your Repositories</h2>
          <Link to="/repositories/new" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Repository
          </Link>
        </div>
        <RepositoriesList />
      </section>
    </div>
  );
}

export default HomePage
