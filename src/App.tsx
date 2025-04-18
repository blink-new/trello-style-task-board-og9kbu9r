
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { BoardProvider } from './components/BoardContext';
import { Auth } from './components/Auth';
import { BoardList } from './components/BoardList';
import { BoardView } from './components/BoardView';
import { Toaster } from './components/ui/toaster';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './components/ui/button';

function AppRoutes() {
  const { user, loading, error } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!user) {
    return <Auth />;
  }
  
  return (
    <BoardProvider>
      <Routes>
        <Route path="/" element={<BoardList />} />
        <Route path="/board/:boardId" element={<BoardView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BoardProvider>
  );
}

function App() {
  const [isClient, setIsClient] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check if Supabase environment variables are available
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables');
        setInitError('Missing Supabase configuration. Please check your environment variables.');
      }
      
      setIsClient(true);
    } catch (error) {
      console.error('App initialization error:', error);
      setInitError('Failed to initialize the application');
    }
  }, []);

  if (initError) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Initialization Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">{initError}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;