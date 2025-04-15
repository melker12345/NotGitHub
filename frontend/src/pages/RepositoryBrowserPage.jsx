import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import FileBrowser from '../components/repositories/FileBrowser';
import { useAuth } from '../contexts/AuthContext';

function RepositoryBrowserPage() {
  const { username, reponame } = useParams();
  useEffect(() => {
    document.title = `${reponame} - Files`;
  }, [reponame]);

  return (
    <div className="container mx-auto px-4 py-8">
      <FileBrowser username={username} reponame={reponame} />
    </div>
  );
}

export default RepositoryBrowserPage;
