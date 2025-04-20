import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RepositoryDetailPage from './pages/RepositoryDetailPage';
import RepositorySettingsPage from './pages/RepositorySettingsPage';
import RepositoryBrowserPage from './pages/RepositoryBrowserPage';
import NewRepositoryPage from './pages/NewRepositoryPage';
import SSHKeysPage from './pages/SSHKeysPage';
import WelcomePage from './pages/WelcomePage';
import ExplorePage from './pages/ExplorePage';
import UserProfilePage from './pages/UserProfilePage';
import RepositoryIssuesPage from './pages/RepositoryIssuesPage';
import CreateIssuePage from './pages/CreateIssuePage';
import IssueDetailPage from './pages/IssueDetailPage';
import RepositoriesPage from './pages/RepositoriesPage';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import ProfileRedirect from './components/ProfileRedirect';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-900 relative overflow-hidden">
          {/* Spotlight effect */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[1000px] h-[600px] rounded-full opacity-20 bg-blue-500 blur-[100px] z-0"></div>
          <Navbar className="relative z-10" />
          <main className="flex-grow container mx-auto px-4 py-8 relative z-20">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/repositories" element={<RepositoriesPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/repositories/new" element={
                <PrivateRoute>
                  <NewRepositoryPage />
                </PrivateRoute>
              } />
              {/* GitHub-style URL pattern - the primary way to access repositories */}
              <Route path="/:username/:reponame" element={<RepositoryDetailPage />} />
              <Route path="/:username/:reponame/settings" element={
                <PrivateRoute>
                  <RepositorySettingsPage />
                </PrivateRoute>
              } />
              <Route path="/:username/:reponame/browser" element={
                <PrivateRoute>
                  <RepositoryBrowserPage />
                </PrivateRoute>
              } />
              {/* Repository Issues Routes */}
              <Route path="/:username/:reponame/issues" element={<RepositoryIssuesPage />} />
              <Route path="/:username/:reponame/issues/new" element={
                <PrivateRoute>
                  <CreateIssuePage />
                </PrivateRoute>
              } />
              <Route path="/:username/:reponame/issues/:issueid" element={<IssueDetailPage />} />
              {/* User profile and settings routes */}
              <Route path="/profile" element={<PrivateRoute>
                <ProfileRedirect />
              </PrivateRoute>} />
              <Route path="/settings" element={<HomePage />} />
              {/* User profile page - must come after the repository routes to avoid conflicts */}
              <Route path="/:username" element={<UserProfilePage />} />
              <Route path="/profile/ssh-keys" element={
                <PrivateRoute>
                  <SSHKeysPage />
                </PrivateRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
