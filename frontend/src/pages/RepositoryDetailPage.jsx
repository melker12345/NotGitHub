import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { repositoryService } from "../services/api";
import repositoryBrowserService from "../services/repositoryBrowserService";
import FileBrowser from "../components/repositories/FileBrowser";
import RepositoryVisibilityBadge from "../components/RepositoryVisibilityBadge";
import { formatDistanceToNow } from "date-fns";
import RepositoryHeader from "../components/repositories/RepositoryHeader";

import { useAuth } from "../contexts/AuthContext";
import {
  canEditRepository,
  canDeleteRepository,
} from "../utils/repositoryAccess";

function RepositoryDetailPage() {
  const { username, reponame } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [repository, setRepository] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const [hasFiles, setHasFiles] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    const fetchRepository = async () => {
      try {
        // Check if we have valid parameters before making the API call
        if (!username || !reponame) {
          setError("Invalid repository URL");
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        const response = await repositoryService.getRepositoryByPath(
          username,
          reponame
        );
        const data = response.data;
        setRepository(data);

        // Check permissions based on repository ownership and visibility
        const ownerCheck = isAuthenticated && user && data.owner_id === user.id;
        setIsOwner(ownerCheck);
        setCanEdit(canEditRepository(data, user));
        setCanDelete(canDeleteRepository(data, user));

        // Check if repository has files
        try {
          const contents = await repositoryBrowserService.getContentsByPath(
            username,
            reponame
          );
          // If we got contents and there are items, the repository has files
          setHasFiles(Array.isArray(contents) && contents.length > 0);
        } catch (contentErr) {
          console.error("Error checking repository contents:", contentErr);
          setHasFiles(false);
        }

        setError("");
      } catch (err) {
        console.error("Error fetching repository:", err);
        if (err.response && err.response.status === 404) {
          setError("Repository not found");
        } else if (err.response && err.response.status === 403) {
          setError("You don't have permission to access this repository");
        } else {
          setError("Failed to load repository");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepository();
  }, [username, reponame, isAuthenticated, user]);

  const handleDelete = async () => {
    try {
      await repositoryService.deleteRepositoryByPath(username, reponame);
      navigate("/");
    } catch (err) {
      console.error("Error deleting repository:", err);
      setError("Failed to delete repository");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess("Copied!");
        setTimeout(() => setCopySuccess(""), 2000);
      },
      () => {
        setCopySuccess("Failed to copy");
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gh-dark-accent-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-opacity-10 bg-gh-dark-accent-red border border-gh-dark-accent-red text-gh-dark-accent-red px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-md border border-gh-dark-border-primary">
        <p className="text-gh-dark-text-secondary">Repository not found</p>
        <Link
          to="/"
          className="mt-4 inline-block text-gh-dark-accent-blue hover:underline"
        >
          Back to repositories
        </Link>
      </div>
    );
  }

  // Safely get clone URLs
  const { https: httpsCloneUrl, ssh: sshCloneUrl } =
    repositoryService.getCloneUrls(repository);

  return (
    <div className="space-y-6">
      <RepositoryHeader
        repository={repository}
        username={username}
        reponame={reponame}
        canEdit={canEdit}
        canDelete={canDelete}
        setShowDeleteModal={setShowDeleteModal}
        httpsCloneUrl={httpsCloneUrl}
        sshCloneUrl={sshCloneUrl}
        copyToClipboard={copyToClipboard}
        isAuthenticated={isAuthenticated}
      />

      {/* Repository Files */}
      <div className="p-6 rounded-lg shadow-md bg-gh-dark-bg-secondary border border-gh-dark-border-primary">
        <h2 className="text-xl font-semibold mb-4 text-gh-dark-text-primary">
          Repository Files
        </h2>

        {/* File browser */}
        <div className="mt-6">
          <div className="bg-gh-dark-bg-tertiary rounded-lg shadow border border-gh-dark-border-secondary">
            {hasFiles ? (
              <FileBrowser username={username} reponame={reponame} />
            ) : (
              <div className="text-center py-8 text-gh-dark-text-secondary">
                <p>This repository is empty</p>
                {isOwner && (
                  <p className="mt-2 text-sm text-gh-dark-text-muted">
                    Use the instructions above to add files to your repository
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Always show repository files, whether empty or not */}
      </div>

      {canDelete && showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-lg w-full border border-gh-dark-border-primary">
            <h2 className="text-xl font-bold mb-4 text-gh-dark-text-primary">
              Delete Repository
            </h2>
            <p className="mb-6 text-gh-dark-text-secondary">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{repository.name}</span>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gh-dark-button-secondary-bg hover:bg-gh-dark-button-secondary-hover text-gh-dark-button-secondary-text rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-gh-dark-button-danger-bg hover:bg-gh-dark-button-danger-hover text-gh-dark-button-danger-text rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unauthorized Access Modal - Shown when non-authenticated users try to perform restricted actions */}
      {!isAuthenticated && showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-lg max-w-md w-full border border-gh-dark-border-primary">
            <h2 className="text-xl font-bold mb-4 text-gh-dark-text-primary">
              Authentication Required
            </h2>
            <p className="mb-6 text-gh-dark-text-secondary">
              You need to be logged in to perform this action.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gh-dark-button-secondary-bg hover:bg-gh-dark-button-secondary-hover text-gh-dark-button-secondary-text rounded-md"
              >
                Cancel
              </button>
              <Link
                to="/login"
                className="px-4 py-2 bg-gh-dark-accent-blue hover:opacity-90 text-white rounded-md inline-block"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RepositoryDetailPage;
