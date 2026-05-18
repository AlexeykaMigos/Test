'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tokenStorage } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center animate-pulse">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">Loading OrderFlow...</p>
      </div>
    </div>
  );
}
