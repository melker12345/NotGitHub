import React from 'react';
import { getVisibilityBadge } from '../utils/repositoryVisibility';

/**
 * Component to display a repository's visibility status
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isPublic - Whether the repository is public
 * @param {string} props.size - Size of the badge (sm, md, lg)
 * @param {boolean} props.showIcon - Whether to show the icon
 * @returns {JSX.Element} - Repository visibility badge
 */
const RepositoryVisibilityBadge = ({ isPublic, size = 'md', showIcon = true }) => {
  const { label, className, icon } = getVisibilityBadge(isPublic);
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 rounded',
    md: 'text-sm px-2 py-1 rounded-md',
    lg: 'text-base px-3 py-1.5 rounded-lg'
  };
  
  return (
    <span className={`inline-flex items-center font-medium ${className} ${sizeClasses[size]}`}>
      {showIcon && (
        <span className="mr-1">
          {icon === 'globe' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
        </span>
      )}
      {label}
    </span>
  );
};

export default RepositoryVisibilityBadge;
