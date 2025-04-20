import React from 'react';
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
  
  // Extract owner username safely
  const owner_username = owner?.username || 'unknown';
  
  const cardClasses = getRepositoryCardClasses(is_public);
  const repoUrl = `/${owner_username}/${name}`;
  const userUrl = `/${owner_username}`;
  
  // Format dates
  const updatedTimeAgo = updated_at ? formatDistanceToNow(new Date(updated_at), { addSuffix: true }) : '';
  const createdTimeAgo = created_at ? formatDistanceToNow(new Date(created_at), { addSuffix: true }) : '';
  
  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold mr-2">
              <Link to={repoUrl} className="text-gh-dark-accent-blue hover:underline">
                {name}
              </Link>
            </h3>
            <RepositoryVisibilityBadge isPublic={is_public} size="sm" />
          </div>
          
          <div className="text-sm text-gh-dark-text-secondary mb-2">
            <Link to={userUrl} className="hover:underline">
              {owner_username}
            </Link>
          </div>
          
          {description && (
            <p className="text-gh-dark-text-secondary text-sm mb-3">{description}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center text-xs text-gh-dark-text-muted mt-2">
        {stars_count > 0 && (
          <div className="flex items-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {stars_count}
          </div>
        )}
        
        {forks_count > 0 && (
          <div className="flex items-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {forks_count}
          </div>
        )}
        
        {updated_at && (
          <div className="mr-4">
            Updated {updatedTimeAgo}
          </div>
        )}
        
        {created_at && !updated_at && (
          <div>
            Created {createdTimeAgo}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryCard;
