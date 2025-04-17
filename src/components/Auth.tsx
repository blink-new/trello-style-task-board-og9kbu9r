
import { useState, useEffect } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function Auth() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(isDarkMode ? 'dark' : 'light');
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Task Board</CardTitle>
          <CardDescription className="text-center">Sign in to manage your projects</CardDescription>
        </CardHeader>
        <CardContent>
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
            }}
            theme={theme}
            providers={['google', 'github']}
          />
        </CardContent>
      </Card>
    </div>
  );
}