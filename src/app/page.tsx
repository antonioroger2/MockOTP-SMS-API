'use client';

import { MessageSquareText } from 'lucide-react';
import Dashboard from '@/components/dashboard';
import { useEffect, useState } from 'react';

export default function Home() {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const newOpacity = Math.max(0, 1 - scrollY / 150);
      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="sticky top-0 z-10 p-4 transition-opacity duration-300"
        style={{ opacity }}
      >
        <div className="container mx-auto flex items-center justify-center gap-3 text-center">
          <MessageSquareText className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            MOCK OTP
          </h1>
        </div>
      </header>
      <main className="flex-1">
        <Dashboard />
      </main>
      <footer className="p-4 border-t text-center text-muted-foreground text-sm">
        <p>
          Built for demonstration purposes. &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
