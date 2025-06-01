import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repositoryService } from '../../services/api';
import RepositoryVisibilityBadge from '../RepositoryVisibilityBadge';
import { formatDistanceToNow } from 'date-fns';
import RepositoryListSection from '../RepositoryListSection';
import RepositoryCard from '../RepositoryCard';

function RepositoriesList() {
  const [repositories, setRepositories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRepositories = async () => {
    try {
      setIsLoading(true);
      const response = await repositoryService.getUserRepositories();
      setRepositories(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load repositories');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  return (
    <RepositoryListSection
      title="Your Repositories"
      loading={isLoading}
      error={error}
      repositories={repositories}
      showSort={false}
      showLoadMore={false}
    />
  );
}

export default RepositoriesList;
