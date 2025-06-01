import React from 'react';
import { Link } from 'react-router-dom';
import RepositoryCard from './RepositoryCard';

function RepositoryListSection({
  title,
  loading,
  error,
  repositories,
  sortOptions,
  handleSortChange,
  sortOption, // Add sortOption to destructured props
  loadMore,
  hasMore,
  showSort = true,
  showLoadMore = true
}) {
  return (
    <section className="bg-gh-dark-bg-secondary text-gh-dark-text-primary rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gh-dark-text-primary">{title}</h2>
        {showSort && sortOptions && handleSortChange && (
          <div className="flex items-center">
            <label htmlFor="sort" className="mr-2 text-gh-dark-text-secondary">Sort by:</label>
            <select
              id="sort"
              value={sortOption}
              onChange={handleSortChange}
              className="border text-gh-dark-text-secondary bg-gh-dark-bg-tertiary border-gh-dark-border-primary rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-gh-dark-accent-blue"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gh-dark-accent-blue"></div>
        </div>
      ) : error ? (
        <div className="bg-opacity-10 bg-gh-dark-accent-red border border-gh-dark-accent-red text-gh-dark-accent-red px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : repositories.length > 0 ? (
        <div className="space-y-4">
          {repositories.map(repo => (
            <RepositoryCard key={repo.id} repository={repo} />
          ))}
        </div>
      ) : (
        <p className="text-gh-dark-text-muted text-center py-8">No {title.toLowerCase()} found</p>
      )}

      {showLoadMore && hasMore && !loading && repositories.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            className="px-4 py-2 bg-gh-dark-accent-blue text-gh-dark-text-primary rounded hover:bg-gh-dark-accent-blue-hover transition-colors duration-200"
          >
            Load More
          </button>
        </div>
      )}
    </section>
  );
}

export default RepositoryListSection;
