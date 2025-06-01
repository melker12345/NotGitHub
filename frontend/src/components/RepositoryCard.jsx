import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RepositoryVisibilityBadge from './RepositoryVisibilityBadge';
import { getRepositoryCardClasses } from '../utils/repositoryVisibility';
import { formatDistanceToNow } from 'date-fns';

/**
 * Component to display a repository card with consistent styling
 * 
 * @param {Object} props - Component props
 * @param {Object} props.repository - Repository object
 * @returns {JSX.Element} - Repository card component
 */
const RepositoryCard = ({ repository }) => {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  if (!repository) return null;
  
  const {
    name,
    description,
    is_public,
    created_at,
    updated_at,
    stars_count = 0,
    forks_count = 0,
    owner
  } = repository;
  
  const owner_username = owner?.username || repository.owner_username || '';
  
  const cardClasses = getRepositoryCardClasses(is_public);
  // Only create valid URLs if we have a valid username
  const hasValidOwner = owner_username && owner_username.trim() !== '';
  const repoUrl = hasValidOwner ? `/${owner_username}/${name}` : '#';
  const userUrl = hasValidOwner ? `/${owner_username}` : '#';
  
  // Format dates
  const updatedTimeAgo = updated_at ? formatDistanceToNow(new Date(updated_at), { addSuffix: true }) : '';
  const createdTimeAgo = created_at ? formatDistanceToNow(new Date(created_at), { addSuffix: true }) : '';
  
  const gradientStyle = isHovered
  ? {
      background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(56, 189, 248, 0.1), transparent 70%)`,
    }
  : {};

  return (
    <Link 
      to={repoUrl} 
      ref={cardRef}
      className={`${cardClasses} group relative block overflow-hidden transition-all duration-300 ease-out`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      style={gradientStyle}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="text-xl font-semibold mr-2">
              <div className="text-gh-dark-accent-blue group-hover:text-gh-dark-accent-blue-hover">
                {name}
              </div>
            </h3>
            <RepositoryVisibilityBadge isPublic={is_public} size="sm" />
          </div>
          
          <div className="text-sm text-gh-dark-text-secondary mb-3">
            <Link to={userUrl} className="hover:underline">
              {owner_username}
            </Link>
          </div>
          
          {description && (
            <p className="text-gh-dark-text-secondary text-sm mb-4 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center text-xs text-gh-dark-text-muted mt-4 gap-x-4 gap-y-1">
        {stars_count > 0 && (
          <div className="flex items-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gh-dark-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {stars_count}
          </div>
        )}
        
        {forks_count > 0 && (
          <div className="flex items-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gh-dark-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {forks_count}
          </div>
        )}
        
        {updated_at && (
          <div className="flex items-center">
            Updated {updatedTimeAgo}
          </div>
        )}
        
        {created_at && !updated_at && (
          <div>
            Created {createdTimeAgo}
          </div>
        )}
      </div>
    </Link>
  );
};

export default RepositoryCard;
