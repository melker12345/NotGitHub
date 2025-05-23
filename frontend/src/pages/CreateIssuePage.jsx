import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { repositoryService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function CreateIssuePage() {
  const { username, reponame } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate(`/${username}/${reponame}/issues`);
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await repositoryService.createIssue(username, reponame, {
        title,
        description
      });
      
      // Redirect to issues list after successful creation
      navigate(`/${username}/${reponame}/issues`);
    } catch (err) {
      console.error('Error creating issue:', err);
      setError('Failed to create issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-6">
        <h1 className="text-2xl font-bold text-gh-dark-text-primary">Create New Issue</h1>
        <span className="text-gh-dark-text-secondary">•</span>
        <span className="text-gh-dark-text-secondary">{username}/{reponame}</span>
      </div>
      
      {error && (
        <div className="bg-gh-dark-bg-tertiary border border-gh-dark-accent-red text-gh-dark-accent-red px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-gh-dark-bg-secondary rounded-lg shadow-md p-6 border border-gh-dark-border-primary max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gh-dark-text-primary mb-2">
              Title <span className="text-gh-dark-accent-red">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gh-dark-border-primary rounded-md bg-gh-dark-bg-primary text-gh-dark-text-primary focus:outline-none focus:border-gh-dark-accent-blue focus:ring-1 focus:ring-gh-dark-accent-blue placeholder-gh-dark-text-secondary text-base"
              placeholder="Issue title"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gh-dark-text-primary mb-2">
              Description <span className="text-gh-dark-text-secondary text-xs">(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full p-2 border border-gh-dark-border-primary rounded-md bg-gh-dark-bg-primary text-gh-dark-text-primary focus:outline-none focus:border-gh-dark-accent-blue focus:ring-1 focus:ring-gh-dark-accent-blue placeholder-gh-dark-text-secondary text-base"
              placeholder="Describe the issue in detail..."
            />
          </div>
          
          <div className="flex items-center justify-between mt-8">
            <div className="text-xs text-gh-dark-text-secondary">
              <span>* Required fields</span>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => navigate(`/${username}/${reponame}/issues`)}
                className="px-4 py-2 bg-gh-dark-bg-tertiary text-gh-dark-text-primary rounded-md hover:bg-gh-dark-bg-hover border border-gh-dark-border-primary font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-gh-dark-accent-blue text-white rounded-md hover:opacity-90 font-medium ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Creating...' : 'Create Issue'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateIssuePage;
