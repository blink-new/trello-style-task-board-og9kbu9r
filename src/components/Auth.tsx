
import { useState, useEffect } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';

export function Auth() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(isDarkMode ? 'dark' : 'light');

    // Check if Supabase is properly configured
    const checkSupabaseConfig = async () => {
      try {
        // Simple health check
        const { error } = await supabase.from('boards').select('count').limit(1);
        if (error && error.code === 'PGRST116') {
          // This is normal - it means the RLS policy is working (not authenticated)
          setAuthError(null);
        } else if (error) {
          console.error('Supabase connection error:', error);
          setAuthError('Failed to connect to the database. Please try again later.');
        }
      } catch (err) {
        console.error('Unexpected Supabase error:', err);
        setAuthError('Failed to connect to the authentication service. Please try again later.');
      }
    };

    checkSupabaseConfig();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Task Board</CardTitle>
          <CardDescription className="text-center">Sign in to manage your projects</CardDescription>
        </CardHeader>
        <CardContent>
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#0ea5e9',
                    brandAccent: '#0284c7',
                  },
                },
              },
              className: {
                button: 'bg-primary hover:bg-primary/90',
                input: 'rounded border-input',
                label: 'text-foreground',
              },
            }}
            theme={theme}
            providers={['google', 'github']}
            redirectTo={window.location.origin}
          />
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <p>Manage your tasks with our beautiful Trello-style board</p>
        </CardFooter>
      </Card>
    </div>
  );
}