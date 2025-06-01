import { Link } from 'react-router-dom';
import RepositoriesList from '../components/repositories/RepositoriesList';
import { useAuth } from '../contexts/AuthContext';

function RepositoriesPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please sign in to view your repositories</h2>
        <div className="mt-4">
          <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md mr-4">
            Sign In
          </Link>
          <Link to="/register" className="border border-gray-300 hover:border-gray-400 px-6 py-2 rounded-md">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8">
      {/* Repositories Section */}
      <RepositoriesList />
    </div>
  );
}

export default RepositoriesPage;
