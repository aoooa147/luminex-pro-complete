'use client';

import dynamic from 'next/dynamic';

const AdminContent = dynamic(() => import('./admin-content'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Loading Admin Dashboard...</div>
    </div>
  ),
});

export default function AdminPage() {
  return <AdminContent />;
}
