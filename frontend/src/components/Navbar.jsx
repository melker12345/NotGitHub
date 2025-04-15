import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  
  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    setIsMenuOpen(false);
    navigate('/login');
  }
  
  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="font-bold text-xl">GitHub Clone</Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4 items-center">
            <Link to="/" className="px-3 py-2 rounded hover:bg-gray-700">Home</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/repositories" className="px-3 py-2 rounded hover:bg-gray-700">Repositories</Link>
                <Link to="/explore" className="px-3 py-2 rounded hover:bg-gray-700">Explore</Link>
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button 
                    className="flex items-center px-3 py-2 rounded hover:bg-gray-700"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="ml-1">{user?.username || 'Profile'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</Link>
                      <Link to="/profile/ssh-keys" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">SSH Keys</Link>
                      <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                      <div className="border-t border-gray-100"></div>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 rounded hover:bg-gray-700">Sign in</Link>
                <Link to="/register" className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700">Sign up</Link>
              </>
            )}
          </div>
          
          {/* Mobile Navigation Toggle */}
          <button 
            className="md:hidden p-2 rounded hover:bg-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            </svg>
          </button>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-2">
            <Link to="/" className="block px-3 py-2 rounded hover:bg-gray-700">Home</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/repositories" className="block px-3 py-2 rounded hover:bg-gray-700">Repositories</Link>
                <Link to="/explore" className="block px-3 py-2 rounded hover:bg-gray-700">Explore</Link>
                <Link to="/profile" className="block px-3 py-2 rounded hover:bg-gray-700">Your Profile</Link>
                <Link to="/profile/ssh-keys" className="block px-3 py-2 rounded hover:bg-gray-700">SSH Keys</Link>
                <Link to="/settings" className="block px-3 py-2 rounded hover:bg-gray-700">Settings</Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded hover:bg-gray-700"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded hover:bg-gray-700">Sign in</Link>
                <Link to="/register" className="block px-3 py-2 rounded hover:bg-gray-700">Sign up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
