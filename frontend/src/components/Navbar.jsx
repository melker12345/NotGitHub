import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  // Log the user object to debug
  console.log('User in Navbar:', user);
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
    <nav className="bg-gh-dark-bg-secondary text-gh-dark-text-primary shadow-md z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="font-bold text-xl">GitHub Clone</Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4 items-center">
            <Link to="/" className="px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary">Home</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/repositories" className="px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary">Repositories</Link>
                <Link to="/explore" className="px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary">Explore</Link>
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button 
                    className="flex items-center px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary"
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
                    <div className="absolute right-0 mt-2 w-48 bg-gh-dark-bg-secondary rounded-md shadow shadow-slate-950 py-1 z-10 border border-gh-dark-border-primary">
                      <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-gh-dark-bg-tertiary">Your Profile</Link>
                      <Link to="/profile/ssh-keys" className="block px-4 py-2 text-sm hover:bg-gh-dark-bg-tertiary">SSH Keys</Link>
                      <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-gh-dark-bg-tertiary">Settings</Link>
                      <div className="border-t border-gh-dark-border-primary"></div>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm font-semibold text-gh-dark-accent-red hover:bg-gh-dark-bg-tertiary"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary">Sign in</Link>
                <Link to="/register" className="px-3 py-2 rounded bg-gh-dark-accent-blue hover:opacity-90">Sign up</Link>
              </>
            )}
          </div>
          
          {/* Mobile Navigation Toggle */}
          <button 
            className="md:hidden p-2 rounded hover:bg-gh-dark-bg-tertiary"
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
            <Link to="/" className="block px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary">Home</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/repositories" className="block px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary">Repositories</Link>
                <Link to="/explore" className="block px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary">Explore</Link>
                <Link to="/profile" className="block px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary">{user?.username || 'Your Profile'}</Link>
                <Link to="/profile/ssh-keys" className="block px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary">SSH Keys</Link>
                <Link to="/settings" className="block px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary">Settings</Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary text-gh-dark-accent-red"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary">Sign in</Link>
                <Link to="/register" className="block px-3 py-2 rounded hover:bg-gh-dark-bg-tertiary text-gh-dark-accent-blue">Sign up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
