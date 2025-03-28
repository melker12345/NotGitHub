import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RepositoryDetailPage from './pages/RepositoryDetailPage'
import RepositorySettingsPage from './pages/RepositorySettingsPage'
import SSHKeysPage from './pages/SSHKeysPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in on component mount
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userStr));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar isAuthenticated={isAuthenticated} user={user} onLogout={logout} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/repositories" element={<HomePage />} />
            <Route 
              path="/repositories/:id" 
              element={
                <ProtectedRoute>
                  <RepositoryDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/repositories/:id/settings" 
              element={
                <ProtectedRoute>
                  <RepositorySettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/profile" element={<HomePage />} />
            <Route 
              path="/profile/ssh-keys" 
              element={
                <ProtectedRoute>
                  <SSHKeysPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/settings" element={<HomePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
