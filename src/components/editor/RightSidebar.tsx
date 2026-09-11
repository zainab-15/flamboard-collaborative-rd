'use client';

import { useState } from 'react';
import styles from './RightSidebar.module.css';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCollaborationStore } from '@/stores/collaborationStore';
import { FlamObject, IntentType, InteractionType } from '@/types/canvas';

interface RightSidebarProps {
  onObjectUpdate: (id: string, changes: Partial<FlamObject>) => void;
  onClearCanvas: () => void;
}

const INTENT_OPTIONS: { value: IntentType; label: string; icon: string }[] = [
  { value: 'product', label: 'Product', icon: '◈' },
  { value: 'cta', label: 'CTA', icon: '→' },
  { value: 'information', label: 'Information', icon: 'ℹ' },
  { value: 'media', label: 'Media', icon: '▶' },
  { value: 'hotspot', label: 'Hotspot', icon: '⊕' },
  { value: 'decorative', label: 'Decorative', icon: '✦' },
];

const INTERACTION_OPTIONS: { value: InteractionType; label: string; icon: string }[] = [
  { value: 'rotate', label: 'Rotate', icon: '↻' },
  { value: 'reveal', label: 'Reveal Info', icon: '◎' },
  { value: 'openLink', label: 'Open Link', icon: '⊞' },
  { value: 'expand', label: 'Expand', icon: '⤢' },
  { value: 'playMedia', label: 'Play Media', icon: '▶' },
];

function SectionHeader({ label, icon }: { label: string; icon?: string }) {
  return (
    <div className={styles.sectionHeader}>
      {icon && <span className={styles.sectionIcon}>{icon}</span>}
      <span>{label}</span>
    </div>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.propRow}>
      <span className={styles.propLabel}>{label}</span>
      <div className={styles.propValue}>{children}</div>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      className={styles.numInput}
      value={Number.isFinite(value) ? Math.round(value) : 0}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}

export default function RightSidebar({ onObjectUpdate, onClearCanvas }: RightSidebarProps) {
  const { objects, selectedIds, mode, updateObject } = useCanvasStore();
  const { peers, currentUser } = useCollaborationStore();
  const [makeInteractiveOpen, setMakeInteractiveOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties');

  const selectedObject = selectedIds.length === 1
    ? objects.find((o) => o.id === selectedIds[0])
    : null;

  const allUsers = [
    ...(currentUser ? [{ ...currentUser, isMe: true }] : []),
    ...peers.map((p) => ({ ...p, isMe: false })),
  ];

  const handleProp = (changes: Partial<FlamObject>) => {
    if (!selectedObject) return;
    updateObject(selectedObject.id, changes);
    onObjectUpdate(selectedObject.id, changes);
  };

  // Smart intent detection
  const detectIntent = (obj: FlamObject): IntentType => {
    if (obj.type === 'hotspot') return 'hotspot';
    if (obj.type === 'text') {
      const t = (obj.text ?? '').toLowerCase();
      if (t.includes('→') || t.includes('explore') || t.includes('buy') || t.includes('get')) return 'cta';
      return 'information';
    }
    if (obj.type === 'rect' && obj.size.width > 100 && obj.size.height < 60) return 'cta';
    if (obj.type === 'ellipse' || obj.type === 'rect') return 'product';
    return 'decorative';
  };

  const applySmartInteraction = () => {
    if (!selectedObject) return;
    const intent = selectedObject.intent ?? detectIntent(selectedObject);
    let interactionType: InteractionType = 'reveal';
    if (intent === 'product') interactionType = 'rotate';
    else if (intent === 'cta') interactionType = 'openLink';
    else if (intent === 'media') interactionType = 'playMedia';
    else if (intent === 'hotspot') interactionType = 'reveal';
    else interactionType = 'expand';

    const changes: Partial<FlamObject> = {
      intent,
      interaction: {
        type: interactionType,
        url: interactionType === 'openLink' ? '#' : undefined,
        revealContent: interactionType === 'reveal' ? 'Add your reveal content here.' : undefined,
        rotationSpeed: interactionType === 'rotate' ? 1.5 : undefined,
      },
    };
    handleProp(changes);
    setMakeInteractiveOpen(true);
  };

  if (mode === 'experience') return null;

  return (
    <aside className={styles.sidebar} aria-label="Properties panel">
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'properties' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('properties')}
          id="tab-properties"
        >
          Properties
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'layers' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('layers')}
          id="tab-layers"
        >
          Layers
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'properties' && (
          <>
            {!selectedObject ? (
              /* No selection */
              <div className={styles.noSelection}>
                {/* Collaborators */}
                <SectionHeader label="Collaborators" icon="◎" />
                <div className={styles.collabList}>
                  {allUsers.map((user) => (
                    <div key={user.id} className={styles.collabRow}>
                      <div
                        className={styles.collabAvatar}
                        style={{ background: user.color }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.collabInfo}>
                        <span className={styles.collabName}>
                          {user.name}{user.isMe ? ' (you)' : ''}
                        </span>
                        <span className={styles.collabActivity}>
                          {user.activity ?? 'Idle'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {allUsers.length === 1 && (
                    <p className={styles.noCollabHint}>
                      Open in another tab to collaborate
                    </p>
                  )}
                </div>

                <div className={styles.divider} />

                {/* Canvas info */}
                <SectionHeader label="Canvas" icon="◻" />
                <div className={styles.canvasInfo}>
                  <PropRow label="Objects">
                    <span>{objects.length}</span>
                  </PropRow>
                </div>

                <div className={styles.divider} />

                <button
                  className={`btn btn-secondary btn-sm ${styles.clearBtn}`}
                  onClick={onClearCanvas}
                  id="clear-canvas-btn"
                >
                  Clear canvas
                </button>
              </div>
            ) : (
              /* Object selected */
              <div className={styles.objectPanel}>
                {/* Object name */}
                <SectionHeader label="Object" icon="◈" />
                <div className={styles.objName}>
                  <input
                    className={styles.nameInput}
                    value={selectedObject.name ?? selectedObject.type}
                    onChange={(e) => handleProp({ name: e.target.value })}
                    placeholder="Object name"
                  />
                  <span className={styles.objType}>{selectedObject.type}</span>
                </div>

                <div className={styles.divider} />

                {/* Intent */}
                <SectionHeader label="Intent" icon="✦" />
                <div className={styles.intentGrid}>
                  {INTENT_OPTIONS.map((intent) => (
                    <button
                      key={intent.value}
                      className={`${styles.intentBtn} ${selectedObject.intent === intent.value ? styles.intentBtnActive : ''}`}
                      onClick={() => handleProp({ intent: intent.value })}
                      aria-label={intent.label}
                      title={intent.label}
                    >
                      <span>{intent.icon}</span>
                      <span>{intent.label}</span>
                    </button>
                  ))}
                </div>

                {/* Make Interactive Feature Block */}
                <div className={styles.interactiveBlock}>
                  <div className={styles.interactiveHeader}>
                    <div className={styles.interactiveTitle}>
                      <span className={styles.interactiveSpark}>✦</span>
                      <span>INTERACTION</span>
                    </div>
                    {selectedObject.interaction ? (
                      <span className={styles.interactiveStatusBadge}>
                        Active: {INTERACTION_OPTIONS.find(i => i.value === selectedObject.interaction?.type)?.label || selectedObject.interaction.type}
                      </span>
                    ) : (
                      <span className={styles.interactiveInactiveBadge}>None</span>
                    )}
                  </div>

                  <p className={styles.interactiveHint}>
                    {selectedObject.interaction
                      ? 'Object is live in ▶ Preview mode.'
                      : 'Assign rotation, click reveal, or URL behavior for ▶ Preview mode.'}
                  </p>

                  <button
                    className={`btn ${selectedObject.interaction ? 'btn-ghost' : 'btn-primary'} ${styles.makeInteractiveBtn}`}
                    onClick={() => {
                      if (!selectedObject.interaction) {
                        applySmartInteraction();
                      } else {
                        setMakeInteractiveOpen(!makeInteractiveOpen);
                      }
                    }}
                    id="make-interactive-btn"
                  >
                    {selectedObject.interaction
                      ? (makeInteractiveOpen ? 'Hide Settings ▴' : 'Configure Behavior ▾')
                      : '✦ Make Interactive'}
                  </button>
                </div>

                {/* Interaction panel */}
                {(makeInteractiveOpen || selectedObject.interaction) && selectedObject.interaction && (
                  <div className={styles.interactionPanel}>
                    <SectionHeader label="Interaction" icon="⊞" />
                    <div className={styles.interactionGrid}>
                      {INTERACTION_OPTIONS.map((int) => (
                        <button
                          key={int.value}
                          className={`${styles.interactionBtn} ${selectedObject.interaction?.type === int.value ? styles.interactionBtnActive : ''}`}
                          onClick={() =>
                            handleProp({
                              interaction: {
                                ...selectedObject.interaction!,
                                type: int.value,
                              },
                            })
                          }
                        >
                          {int.icon} {int.label}
                        </button>
                      ))}
                    </div>

                    {selectedObject.interaction.type === 'reveal' && (
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Reveal content</label>
                        <textarea
                          className={styles.textarea}
                          value={selectedObject.interaction.revealContent ?? ''}
                          onChange={(e) =>
                            handleProp({
                              interaction: {
                                ...selectedObject.interaction!,
                                revealContent: e.target.value,
                              },
                            })
                          }
                          rows={3}
                          placeholder="Text to reveal on click"
                        />
                      </div>
                    )}

                    {selectedObject.interaction.type === 'openLink' && (
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>URL</label>
                        <input
                          className={styles.textInput}
                          type="url"
                          value={selectedObject.interaction.url ?? ''}
                          onChange={(e) =>
                            handleProp({
                              interaction: {
                                ...selectedObject.interaction!,
                                url: e.target.value,
                              },
                            })
                          }
                          placeholder="https://..."
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.divider} />

                {/* Properties */}
                <SectionHeader label="Properties" icon="⊟" />
                <div className={styles.propsGrid}>
                  <PropRow label="X">
                    <NumberInput
                      value={selectedObject.position.x}
                      onChange={(v) => handleProp({ position: { ...selectedObject.position, x: v } })}
                    />
                  </PropRow>
                  <PropRow label="Y">
                    <NumberInput
                      value={selectedObject.position.y}
                      onChange={(v) => handleProp({ position: { ...selectedObject.position, y: v } })}
                    />
                  </PropRow>
                  {selectedObject.type !== 'stroke' && selectedObject.type !== 'line' && (
                    <>
                      <PropRow label="W">
                        <NumberInput
                          value={selectedObject.size.width}
                          min={1}
                          onChange={(v) => handleProp({ size: { ...selectedObject.size, width: v } })}
                        />
                      </PropRow>
                      <PropRow label="H">
                        <NumberInput
                          value={selectedObject.size.height}
                          min={1}
                          onChange={(v) => handleProp({ size: { ...selectedObject.size, height: v } })}
                        />
                      </PropRow>
                    </>
                  )}
                  <PropRow label="°">
                    <NumberInput
                      value={selectedObject.rotation}
                      min={-180}
                      max={180}
                      onChange={(v) => handleProp({ rotation: v })}
                    />
                  </PropRow>
                  <PropRow label="Opacity">
                    <NumberInput
                      value={Math.round(selectedObject.opacity * 100)}
                      min={0}
                      max={100}
                      onChange={(v) => handleProp({ opacity: v / 100 })}
                    />
                  </PropRow>
                  {selectedObject.fill !== undefined && (
                    <PropRow label="Fill">
                      <input
                        type="color"
                        className={styles.colorInput}
                        value={selectedObject.fill?.startsWith('#') ? selectedObject.fill : '#FAF6F0'}
                        onChange={(e) => handleProp({ fill: e.target.value })}
                      />
                    </PropRow>
                  )}
                  {selectedObject.stroke !== undefined && (
                    <PropRow label="Stroke">
                      <input
                        type="color"
                        className={styles.colorInput}
                        value={selectedObject.stroke?.startsWith('#') ? selectedObject.stroke : '#1A0F08'}
                        onChange={(e) => handleProp({ stroke: e.target.value })}
                      />
                    </PropRow>
                  )}
                  {selectedObject.type === 'text' && (
                    <>
                      <PropRow label="Size">
                        <NumberInput
                          value={selectedObject.fontSize ?? 16}
                          min={6}
                          max={200}
                          onChange={(v) => handleProp({ fontSize: v })}
                        />
                      </PropRow>
                    </>
                  )}
                </div>

                {/* Visibility / Lock */}
                <div className={styles.divider} />
                <div className={styles.toggleRow}>
                  <button
                    className={`${styles.toggleBtn} ${selectedObject.visible ? styles.toggleBtnOn : ''}`}
                    onClick={() => handleProp({ visible: !selectedObject.visible })}
                  >
                    {selectedObject.visible ? '◎ Visible' : '◌ Hidden'}
                  </button>
                  <button
                    className={`${styles.toggleBtn} ${selectedObject.locked ? styles.toggleBtnOn : ''}`}
                    onClick={() => handleProp({ locked: !selectedObject.locked })}
                  >
                    {selectedObject.locked ? '⊠ Locked' : '⊟ Unlocked'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'layers' && (
          <div className={styles.layersPanel}>
            <SectionHeader label="Layers" icon="◫" />
            <div className={styles.layerList}>
              {[...objects].reverse().map((obj) => (
                <button
                  key={obj.id}
                  className={`${styles.layerItem} ${selectedIds.includes(obj.id) ? styles.layerItemSelected : ''}`}
                  onClick={() => {
                    const store = useCanvasStore.getState();
                    store.setSelectedIds([obj.id]);
                  }}
                >
                  <span className={styles.layerType}>{obj.type[0].toUpperCase()}</span>
                  <span className={styles.layerName}>{obj.name ?? obj.type}</span>
                  <span className={styles.layerIntent}>
                    {obj.intent ? `${obj.intent}` : ''}
                    {obj.interaction ? ' ⊞' : ''}
                  </span>
                </button>
              ))}
              {objects.length === 0 && (
                <p className={styles.emptyLayers}>No objects yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
