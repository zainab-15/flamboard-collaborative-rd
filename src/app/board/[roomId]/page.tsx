'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Konva
const Editor = dynamic(() => import('@/components/editor/Editor'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAF6F0',
        fontFamily: 'Inter, sans-serif',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ fontSize: '28px' }}>✦</div>
      <div style={{ fontSize: '14px', color: '#9B8B7A' }}>Loading FLAMBOARD…</div>
    </div>
  ),
});

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function BoardPage({ params }: PageProps) {
  const { roomId } = use(params);
  const searchParams = useSearchParams();
  const userName = searchParams.get('name') || 'Designer';
  const loadDemo = searchParams.get('demo') === '1';

  return <Editor roomId={roomId} userName={userName} loadDemo={loadDemo} />;
}
