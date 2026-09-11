'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import styles from './landing.module.css';

const DEMO_ROOM_ID = 'demo';

export default function LandingPage() {
  const router = useRouter();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [userName, setUserName] = useState('');
  const [copied, setCopied] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const rect = heroRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const name = userName.trim() || 'Designer';

  const handleCreate = () => {
    const roomId = uuidv4().split('-')[0];
    router.push(`/board/${roomId}?name=${encodeURIComponent(name)}&demo=1`);
  };

  const handleOpenDemo = () => {
    router.push(`/board/${DEMO_ROOM_ID}?name=${encodeURIComponent(name)}`);
  };

  const handleCopyDemoLink = async () => {
    const url = `${window.location.origin}/board/${DEMO_ROOM_ID}?name=Recruiter`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const px = mousePos.x * 8;
  const py = mousePos.y * 8;
  const px2 = mousePos.x * 14;
  const py2 = mousePos.y * 14;

  return (
    <main className={styles.page}>
      {/* Ambient background */}
      <div className={styles.ambient} aria-hidden>
        <div className={styles.ambientBlob1} style={{ transform: `translate(${px}px, ${py}px)` }} />
        <div className={styles.ambientBlob2} style={{ transform: `translate(${-px2}px, ${-py2}px)` }} />
        <div className={styles.ambientBlob3} style={{ transform: `translate(${px2 * 0.5}px, ${py2 * 0.7}px)` }} />
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoMark} aria-hidden>✦</span>
          <span className={styles.logoText}>FLAMBOARD</span>
        </div>
        <nav className={styles.nav}>
          <span className={styles.tagBeta}>Beta</span>
        </nav>
      </header>

      {/* Hero */}
      <section className={styles.hero} ref={heroRef} aria-labelledby="hero-title">
        <div className={styles.heroContent} style={{ transform: `translate(${mousePos.x * 2}px, ${mousePos.y * 2}px)` }}>
          <p className={styles.heroEyebrow}>Real-time collaborative canvas</p>
          <h1 id="hero-title" className={styles.heroTitle}>
            <span className={styles.heroTitleSerif}>Ideas don&rsquo;t</span>
            <br />sit still.
          </h1>
          <p className={styles.heroSubtitle}>
            Create interactive experiences together, in real time.
            <br />From sketch to interactive — without leaving the canvas.
          </p>

          <div className={styles.heroFlow} aria-label="Workflow">
            <span>Imagine</span><span className={styles.flowArrow} aria-hidden>→</span>
            <span>Collaborate</span><span className={styles.flowArrow} aria-hidden>→</span>
            <span>Create</span><span className={styles.flowArrow} aria-hidden>→</span>
            <span className={styles.flowAccent}>Experience</span>
          </div>

          {/* Name input */}
          <label htmlFor="user-name-input" className={styles.inputLabel}>Your name</label>
          <div className={styles.heroActions}>
            <input
              id="user-name-input"
              className={styles.nameInput}
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              maxLength={30}
              autoComplete="given-name"
            />
            <button
              className={`btn btn-primary btn-lg ${styles.createBtn}`}
              onClick={handleCreate}
              id="create-board-btn"
            >
              + New Board
            </button>
          </div>

          {/* Demo room CTA — the key recruiter entry point */}
          <div className={styles.demoCTA}>
            <button
              className={styles.demoBtn}
              onClick={handleOpenDemo}
              id="open-demo-btn"
            >
              <span className={styles.demoBtnIcon}>✦</span>
              Open AURA Campaign Demo
            </button>
            <button
              className={styles.copyLinkBtn}
              onClick={handleCopyDemoLink}
              id="copy-demo-link-btn"
              title="Copy shareable link"
              aria-label="Copy demo link"
            >
              {copied ? '✓ Copied!' : '⎘ Copy link'}
            </button>
          </div>
        </div>

        {/* Preview card */}
        <div
          className={styles.previewCard}
          aria-hidden
          style={{ transform: `translate(${mousePos.x * 4}px, ${mousePos.y * 4}px) rotate(${mousePos.x * 0.5}deg)` }}
        >
          <div className={styles.previewCardHeader}>
            <div className={styles.previewDot} style={{ background: '#E07070' }} />
            <div className={styles.previewDot} style={{ background: '#E0C070' }} />
            <div className={styles.previewDot} style={{ background: '#70C070' }} />
            <span className={styles.previewTitle}>AURA Campaign · demo</span>
          </div>
          <div className={styles.previewBody}>
            <div className={styles.previewProductCircle} />
            <div className={styles.previewText1} />
            <div className={styles.previewText2} />
            <div className={styles.previewCTA} />
            <div className={styles.previewAnnotation}>← Make this interactive</div>
            <div className={styles.previewCursor}>
              <svg width="14" height="18" viewBox="0 0 16 20" fill="none" aria-hidden>
                <path d="M0 0l16 10-7 2-3 8L0 0z" fill="#C77B5A" />
              </svg>
              <span className={styles.previewCursorName}>Arjun · Drawing</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — 3 steps, concise */}
      <section className={styles.howSection} aria-labelledby="how-title">
        <h2 id="how-title" className={styles.howTitle}>How it works</h2>
        <div className={styles.steps}>
          {[
            { n: '01', head: 'Draw & place objects', body: 'Use the toolbar to draw, add text, shapes, and hotspots on a shared canvas.' },
            { n: '02', head: 'Assign intent', body: 'Mark each object as Product, CTA, Hotspot, or Information. Give it a behaviour.' },
            { n: '03', head: 'Preview the experience', body: 'Click ▶ Preview. Objects become interactive. Share the URL — collaborators join live.' },
          ].map(({ n, head, body }) => (
            <div key={n} className={styles.step}>
              <span className={styles.stepNum}>{n}</span>
              <h3 className={styles.stepHead}>{head}</h3>
              <p className={styles.stepBody}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <span className={styles.footerLogo}>✦ FLAMBOARD</span>
        <span className={styles.footerSep}>·</span>
        <span>FlamAI Frontend R&amp;D</span>
        <span className={styles.footerSep}>·</span>
        <span className={styles.footerMuted}>Real-time collaborative canvas</span>
      </footer>
    </main>
  );
}
