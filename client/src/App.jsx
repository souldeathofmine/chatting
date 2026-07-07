import { Component, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import useAuth from './hooks/useAuth.js';
import useStore from './store/useStore.js';
import { ThemeProvider } from './context/ThemeContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import ChatPage from './pages/ChatPage.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-950 p-8">
          <div className="bg-dark-800 rounded-2xl p-8 max-w-lg border border-dark-700">
            <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
            <pre className="text-sm text-gray-400 mt-4 overflow-auto max-h-60">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
              className="btn-primary mt-4"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  const { user: authUser, loading } = useAuth();
  const storeUser = useStore((s) => s.user);
  const setStoreUser = useStore((s) => s.setUser);

  useEffect(() => { setStoreUser(authUser); }, [authUser, setStoreUser]);

  const user = storeUser || authUser;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Routes>
          <Route
            path="*"
            element={
              !user ? <AuthPage /> :
              !user.onboardingComplete ? <OnboardingPage /> :
              <ChatPage />
            }
          />
        </Routes>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
