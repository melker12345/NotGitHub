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
      ? 'bg-opacity-10 bg-gh-dark-accent-green text-gh-dark-accent-green border border-gh-dark-accent-green' 
      : 'bg-opacity-10 bg-gh-dark-accent-yellow text-gh-dark-accent-yellow border border-gh-dark-accent-yellow',
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
  const baseClasses = 'bg-gh-dark-bg-secondary rounded-md p-4 mb-4 transition-all duration-200 border border-gh-dark-border-primary';
  return isPublic
    ? `${baseClasses} hover:shadow-md`
    : `${baseClasses} hover:shadow-md`;
};

/**
 * Get icon name for repository visibility
 * @param {boolean} isPublic - Whether the repository is public
 * @returns {string} - Icon name
 */
export const getVisibilityIcon = (isPublic) => {
  return isPublic ? 'globe' : 'lock';
};
