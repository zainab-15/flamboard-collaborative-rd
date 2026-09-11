'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './TopBar.module.css';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCollaborationStore } from '@/stores/collaborationStore';

interface TopBarProps {
  roomId: string;
  boardName: string;
}

const ACTIVITY_COLORS: Record<string, string> = {
  Drawing: '#C77B5A',
  Editing: '#8B6BAE',
  Selecting: '#5A9B7A',
  'Adding text': '#D4A853',
  Moving: '#4A89B0',
  Idle: '#C4B4A4',
};

export default function TopBar({ roomId, boardName }: TopBarProps) {
  const router = useRouter();
  const { mode, setMode } = useCanvasStore();
  const { peers, currentUser, connected, connecting, reconnecting } = useCollaborationStore();

  const allUsers = [
    ...(currentUser ? [{ ...currentUser, isMe: true }] : []),
    ...peers.map((p) => ({ ...p, isMe: false })),
  ];

  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/board/${roomId}` : '';
    if (url) {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenSecondTab = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/board/${roomId}?name=Collaborator`;
      window.open(url, '_blank');
    }
  };

  return (
    <header className={styles.topbar}>
      {/* Brand + name */}
      <div className={styles.left}>
        <button
          className={styles.logo}
          onClick={() => router.push('/')}
          id="topbar-logo"
          aria-label="FLAMBOARD home"
        >
          <span className={styles.logoMark}>✦</span>
          <span className={styles.logoText}>FLAMBOARD</span>
        </button>
        <div className={styles.sep} />
        <span className={styles.boardName}>{boardName}</span>
        <span className={styles.roomId}>#{roomId}</span>
      </div>

      {/* Collaborators */}
      <div className={styles.center}>
        <div className={styles.avatarRow}>
          {allUsers.slice(0, 6).map((user, i) => (
            <div
              key={user.id}
              className={styles.avatarWrap}
              style={{ zIndex: 10 - i }}
              title={`${user.name}${user.isMe ? ' (you)' : ''} · ${user.activity ?? 'Idle'}`}
            >
              <div
                className={styles.avatar}
                style={{ background: user.color, borderColor: user.isMe ? '#C77B5A' : 'transparent' }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!user.isMe && (
                <div
                  className={styles.activityDot}
                  style={{ background: ACTIVITY_COLORS[user.activity ?? 'Idle'] ?? '#C4B4A4' }}
                />
              )}
            </div>
          ))}
          {allUsers.length > 6 && (
            <div className={`${styles.avatar} ${styles.avatarMore}`}>
              +{allUsers.length - 6}
            </div>
          )}
        </div>

        {/* Connection state */}
        <div
          className={`${styles.connBadge} ${
            connected
              ? styles.connOnline
              : reconnecting || connecting
              ? styles.connSync
              : styles.connOffline
          }`}
          title={
            connected
              ? 'Socket.IO live · Connected to room'
              : reconnecting
              ? 'Reconnecting to collaboration server…'
              : connecting
              ? 'Connecting to collaboration server…'
              : 'Disconnected from collaboration server'
          }
        >
          <span className={styles.connDot} />
          {connected
            ? 'Live'
            : reconnecting
            ? 'Reconnecting…'
            : connecting
            ? 'Connecting…'
            : 'Disconnected'}
        </div>
      </div>

      {/* Right actions */}
      <div className={styles.right}>
        {/* Mode toggle */}
        <div className={styles.modeToggle} role="group" aria-label="Editor mode">
          <button
            className={`${styles.modeBtn} ${mode === 'edit' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('edit')}
            id="mode-edit-btn"
            aria-pressed={mode === 'edit'}
          >
            Edit
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'experience' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('experience')}
            id="mode-experience-btn"
            aria-pressed={mode === 'experience'}
          >
            ▶ Preview
          </button>
        </div>

        <div className={styles.shareWrapper}>
          <button
            className="btn btn-primary btn-sm"
            id="share-btn"
            onClick={() => setShowShare(!showShare)}
            aria-expanded={showShare}
          >
            Share ↗
          </button>

          {showShare && (
            <div className={styles.sharePopover} role="dialog" aria-label="Share board">
              <div className={styles.sharePopoverHeader}>
                <h4 className={styles.shareTitle}>Collaborate in Real Time</h4>
                <button
                  className={styles.closeBtn}
                  onClick={() => setShowShare(false)}
                  aria-label="Close share dialog"
                >
                  ✕
                </button>
              </div>
              <p className={styles.shareSubtitle}>
                Invite others to draw, edit objects, and experience this canvas live.
              </p>
              <div className={styles.linkBox}>
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/board/${roomId}` : ''}
                  className={styles.linkInput}
                  id="share-link-input"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  className={`btn ${copied ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                  onClick={handleCopyLink}
                  id="copy-share-link-btn"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <div className={styles.shareActions}>
                <button
                  className={styles.openTabBtn}
                  onClick={handleOpenSecondTab}
                  id="open-second-tab-btn"
                >
                  <span>👥 Open 2nd tab to test real-time sync</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
