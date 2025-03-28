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
      await sshKeyService.deleteKey(id);
      setSuccessMessage('SSH key deleted successfully');
      fetchKeys();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting SSH key:', err);
      setError('Failed to delete SSH key');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SSH Keys</h1>
      
      {/* Add New SSH Key Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Add New SSH Key</h2>
        
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleAddKey}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={newKey.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 'Work Laptop' or 'Personal MacBook'"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="public_key" className="block text-sm font-medium text-gray-700 mb-1">
              Public Key
            </label>
            <textarea
              id="public_key"
              name="public_key"
              rows="4"
              value={newKey.public_key}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Begins with 'ssh-rsa', 'ssh-ed25519', etc."
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Paste your public SSH key here. You can generate one using <code>ssh-keygen</code> command.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Add SSH Key
            </button>
          </div>
        </form>
      </div>
      
      {/* SSH Keys List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Your SSH Keys</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        ) : keys.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded-md text-center">
            <p className="text-gray-600">You don't have any SSH keys yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {keys.map((key) => (
              <li key={key.id} className="py-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{key.name}</h3>
                    <p className="mt-1 text-sm text-gray-600 font-mono truncate">
                      {key.fingerprint}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Added on {new Date(key.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className="text-red-600 hover:text-red-900"
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
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Setting Up SSH</h2>
        
        <div className="prose">
          <h3>Generate an SSH Key Pair</h3>
          <p>Run the following command in your terminal:</p>
          <div className="bg-gray-100 p-3 rounded-md font-mono text-sm mb-4">
            ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
          </div>
          
          <h3>Find Your Public Key</h3>
          <p>Your public key is typically located at:</p>
          <ul>
            <li>On Windows: <code>C:\Users\YOUR_USERNAME\.ssh\id_rsa.pub</code></li>
            <li>On macOS/Linux: <code>~/.ssh/id_rsa.pub</code></li>
          </ul>
          
          <h3>Add Your Key</h3>
          <p>
            Copy the contents of your public key file and paste it in the form above.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SSHKeysPage;
