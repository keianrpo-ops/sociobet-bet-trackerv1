'use client';
import dynamic from 'next/dynamic';

// Import App dynamically to disable SSR, as the Dashboard uses browser-only APIs 
// like localStorage and HashRouter which cause hydration mismatch on server.
const App = dynamic(() => import('../App'), { ssr: false });

export default function Page() {
  return <App />;
}