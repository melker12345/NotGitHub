/**
 * Utility functions for handling repository visibility in the UI
 */

/**
 * Get a badge component props for repository visibility
 * @param {boolean} isPublic - Whether the repository is public
 * @returns {Object} - Object with label and CSS class for the badge
 */
export const getVisibilityBadge = (isPublic) => {
  return {
    label: isPublic ? 'Public' : 'Private',
    className: isPublic 
      ? 'bg-green-100 text-green-800 border border-green-200' 
      : 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    icon: isPublic ? 'globe' : 'lock'
  };
};

/**
 * Get a description for repository visibility
 * @param {boolean} isPublic - Whether the repository is public
 * @returns {string} - Description of visibility
 */
export const getVisibilityDescription = (isPublic) => {
  return isPublic 
    ? 'Anyone can see this repository. You choose who can commit.'
    : 'You choose who can see and commit to this repository.';
};

/**
 * Get CSS classes for repository card based on visibility
 * @param {boolean} isPublic - Whether the repository is public
 * @returns {string} - CSS classes for the repository card
 */
export const getRepositoryCardClasses = (isPublic) => {
  const baseClasses = 'border rounded-md p-4 mb-4 transition-all duration-200';
  return isPublic
    ? `${baseClasses} border-green-200 hover:border-green-300 hover:shadow-md`
    : `${baseClasses} border-yellow-200 hover:border-yellow-300 hover:shadow-md`;
};

/**
 * Get icon name for repository visibility
 * @param {boolean} isPublic - Whether the repository is public
 * @returns {string} - Icon name
 */
export const getVisibilityIcon = (isPublic) => {
  return isPublic ? 'globe' : 'lock';
};
