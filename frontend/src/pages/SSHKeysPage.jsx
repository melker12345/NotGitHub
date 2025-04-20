import { useState, useEffect } from 'react';
import sshKeyService from '../services/sshKeyService';

function SSHKeysPage() {
  const [keys, setKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newKey, setNewKey] = useState({ name: '', public_key: '' });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setIsLoading(true);
      const data = await sshKeyService.getKeys();
      setKeys(data);
      setError('');
    } catch (err) {
      console.error('Error fetching SSH keys:', err);
      setError('Failed to load SSH keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewKey((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddKey = async (e) => {
    e.preventDefault();
    
    if (!newKey.name.trim() || !newKey.public_key.trim()) {
      setError('Name and public key are required');
      return;
    }

    try {
      await sshKeyService.addKey(newKey);
      setSuccessMessage('SSH key added successfully');
      setNewKey({ name: '', public_key: '' });
      fetchKeys();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error adding SSH key:', err);
      setError('Failed to add SSH key. Make sure it is a valid SSH public key.');
    }
  };

  const handleDeleteKey = async (id) => {
    try {
      setError(''); // Clear any previous errors
      await sshKeyService.deleteKey(id);
      setSuccessMessage('SSH key deleted successfully');
      
      // Refresh the list of keys after deletion
      fetchKeys();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting SSH key:', err);
      if (err.response && err.response.status === 404) {
        setError('SSH key not found. It may have been already deleted.');
      } else {
        setError('Failed to delete SSH key. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6 text-gh-dark-text-secondary">
      <h1 className="text-2xl font-bold text-gh-dark-text-primary">SSH Keys</h1>
      
      {/* Add New SSH Key Form */}
      <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-md border border-gh-dark-border-primary">
        <h2 className="text-xl font-semibold mb-4 text-gh-dark-text-primary">Add New SSH Key</h2>
        
        {error && (
          <div className="mb-4 bg-opacity-10 bg-gh-dark-accent-red border border-gh-dark-accent-red text-gh-dark-accent-red px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 bg-opacity-10 bg-gh-dark-accent-green border border-gh-dark-accent-green text-gh-dark-accent-green px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleAddKey}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gh-dark-text-secondary mb-1">
              Title
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={newKey.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gh-dark-border-primary rounded-md shadow-sm bg-gh-dark-bg-tertiary text-gh-dark-text-secondary focus:outline-none focus:ring-gh-dark-accent-blue focus:border-gh-dark-accent-blue"
              placeholder="e.g., 'Work Laptop' or 'Personal MacBook'"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="public_key" className="block text-sm font-medium text-gh-dark-text-secondary mb-1">
              Public Key
            </label>
            <textarea
              id="public_key"
              name="public_key"
              rows="4"
              value={newKey.public_key}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Begins with 'ssh-rsa', 'ssh-ed25519', etc."
              required
            />
            <p className="mt-1 text-sm text-gh-dark-text-muted">
              Paste your public SSH key here. You can generate one using <code>ssh-keygen</code> command.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-gh-dark-accent-blue hover:opacity-90 text-gh-dark-button-primary-text rounded-md transition-colors duration-200"
            >
              Add SSH Key
            </button>
          </div>
        </form>
      </div>
      
      {/* SSH Keys List */}
      <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-md border border-gh-dark-border-primary">
        <h2 className="text-xl font-semibold mb-4 text-gh-dark-text-primary">Your SSH Keys</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gh-dark-accent-blue"></div>
          </div>
        ) : keys.length === 0 ? (
          <div className="bg-gh-dark-bg-tertiary p-4 rounded-md text-center border border-gh-dark-border-secondary">
            <p className="text-gh-dark-text-secondary">You don't have any SSH keys yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gh-dark-border-primary">
            {keys.map((key) => (
              <li key={key.id} className="py-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gh-dark-text-primary">{key.name}</h3>
                    <p className="mt-1 text-sm text-gh-dark-text-muted font-mono truncate">
                      {key.fingerprint}
                    </p>
                    <p className="mt-1 text-xs text-gh-dark-text-muted">
                      Added on {new Date(key.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className="text-gh-dark-accent-red hover:opacity-80 transition-colors duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Help Section */}
      <div className="bg-gh-dark-bg-secondary p-6 rounded-lg shadow-md border border-gh-dark-border-primary">
        <h2 className="text-xl font-semibold mb-4 text-gh-dark-text-primary">Setting Up SSH</h2>
        
        <div className="prose prose-invert">
          <h3>Generate an SSH Key Pair</h3>
          <p>Run the following command in your terminal:</p>
          <div className="bg-gh-dark-bg-tertiary p-3 rounded-md font-mono text-sm mb-4 text-gh-dark-text-secondary border border-gh-dark-border-secondary">
            ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
          </div>
          
          <h3>Find Your Public Key</h3>
          <p>Your public key is typically located at:</p>
          <ul>
            <li>On Windows: <code>C:\Users\YOUR_USERNAME\.ssh\id_rsa.pub</code></li>
            <li>On macOS/Linux: <code>~/.ssh/id_rsa.pub</code></li>
          </ul>
          
          <h3>Using SSH with Git</h3>
          <p>To clone a repository using SSH:</p>
          <div className="bg-gray-700 p-3 rounded-md font-mono text-sm text-gray-200 border border-gray-600">
            git clone ssh://git@localhost:2222/username/repo.git
          </div>
        </div>
      </div>
    </div>
  );
}

export default SSHKeysPage;
