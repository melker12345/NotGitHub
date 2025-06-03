import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RepositoryVisibilityBadge from '../RepositoryVisibilityBadge';
import { formatDistanceToNow } from 'date-fns';

const RepositoryHeader = ({
  repository,
  username,
  reponame,
  canEdit,
  canDelete,
  setShowDeleteModal,
  httpsCloneUrl,
  sshCloneUrl,
  isAuthenticated,
}) => {
  const [copySuccess, setCopySuccess] = useState('');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      },
      () => {
        setCopySuccess('Failed to copy');
      }
    );
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center mb-4">
            <h1 className="text-2xl font-bold mr-2 text-white">
              {repository.name}
            </h1>
            <RepositoryVisibilityBadge isPublic={repository.is_public} />
          </div>
          {repository.description && (
            <p className="text-gray-400 mb-4">
              {repository.description || "No description provided."}
            </p>
          )}

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <Link
                to={`/${username}`}
                className="hover:underline text-gray-300"
              >
                {username}
              </Link>
            </div>
            <div className="flex items-center text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{repository.stars} stars</span>
            </div>
            <div className="flex items-center text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <span>{repository.forks} forks</span>
            </div>
          </div>
          <div className="text-gray-400 text-sm">
            <p>
              Created{" "}
              {formatDistanceToNow(new Date(repository.created_at), {
                addSuffix: true,
              })}
            </p>
            {repository.updated_at &&
              repository.updated_at !== repository.created_at && (
                <p>
                  Updated{" "}
                  {formatDistanceToNow(new Date(repository.updated_at), {
                    addSuffix: true,
                  })}
                </p>
              )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/${username}/${reponame}/browser`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            Browse Files
          </Link>

          {/* Issues tab - shown to all users */}
          <Link
            to={`/${username}/${reponame}/issues`}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Issues
          </Link>

          {/* Only show settings link if user can edit */}
          {canEdit && (
            <Link
              to={`/${username}/${reponame}/settings`}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm font-medium"
            >
              Settings
            </Link>
          )}

          {/* Only show delete button if user can delete */}
          {canDelete && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      {/* New Quick Setup Section */}
      <div className="mt-6 pt-4 border-t border-gray-600 w-full">
        <h4 className="text-md font-semibold mb-3 text-gray-200">
          Quick setup
        </h4>
        <div className="flex flex-row space-x-3">
          {/* HTTPS Clone Command */}
         
        </div>
        {(httpsCloneUrl || sshCloneUrl) && (
          <p className="mt-3 text-xs text-gray-500">
            {isAuthenticated ? (
              <>
                Don't forget to{" "}
                <Link
                  to="/profile/ssh-keys"
                  className="text-blue-500 hover:underline"
                >
                  add your SSH key
                </Link>{" "}
                before using SSH.
              </>
            ) : (
              <>
                <Link to="/login" className="text-blue-500 hover:underline">
                  Log in
                </Link>{" "}
                to add SSH keys for SSH cloning.
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default RepositoryHeader;
