import { useState } from 'react'
import { Link } from 'react-router-dom'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="font-bold text-xl">GitHub Clone</Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            <Link to="/" className="px-3 py-2 rounded hover:bg-gray-700">Home</Link>
            <Link to="/repositories" className="px-3 py-2 rounded hover:bg-gray-700">Repositories</Link>
            <Link to="/explore" className="px-3 py-2 rounded hover:bg-gray-700">Explore</Link>
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
            <Link to="/repositories" className="block px-3 py-2 rounded hover:bg-gray-700">Repositories</Link>
            <Link to="/explore" className="block px-3 py-2 rounded hover:bg-gray-700">Explore</Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
