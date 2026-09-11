import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FLAMBOARD — From ideas to interactive experiences',
  description:
    'FLAMBOARD is a real-time collaborative authoring studio. Draw, collaborate, make interactive, and experience — together.',
  keywords: 'collaborative canvas, real-time drawing, interactive content, whiteboard, collaboration',
  openGraph: {
    title: 'FLAMBOARD',
    description: 'From ideas to interactive experiences.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FAF6F0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Caveat:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
