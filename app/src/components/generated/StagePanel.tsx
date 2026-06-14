import { useEffect, useState } from 'react';
import { Icon, cx } from './ui';
import { BlockerCard } from './BlockerCard';
import { BLOCKER_TOTAL_STEPS, BLOCKER_TYPES, buildBlockers, type Blocker } from './data';

const STAGES = [
  'Intake',
  'Audit',
  'Provider Reporting',
  'Dispute',
  'Client Reporting',
  'Appeals',
  'Closed',
];

// stages a blocker can skip the claim to (all but the current "Audit" stage)
const SKIP_STAGES = STAGES.filter((s) => s !== 'Audit');

export function StagePanel({ notify }: { notify: (m: string) => void }) {
  const [blockers, setBlockers] = useState<Blocker[]>(buildBlockers);
  const [addOpen, setAddOpen] = useState(false);
  const [hideResolved, setHideResolved] = useState(false);

  const activeCount = blockers.filter((b) => b.status === 'active').length;
  const resolvedCount = blockers.filter((b) => b.status === 'resolved').length;
  const visibleBlockers = hideResolved
    ? blockers.filter((b) => b.status !== 'resolved')
    : blockers;

  const patch = (id: string, fn: (b: Blocker) => Blocker) =>
    setBlockers((prev) => prev.map((b) => (b.id === id ? fn(b) : b)));

  function toggle(id: string) {
    patch(id, (b) => ({ ...b, expanded: !b.expanded }));
  }
  function advance(id: string) {
    // primary action — send a reminder, advance a step; resolve at the end
    patch(id, (b) => {
      const reminders = b.reminders + 1;
      const step = b.step + 1;
      if (step >= b.totalSteps) {
        notify('Blocker resolved');
        return { ...b, reminders, step: b.totalSteps, status: 'resolved' };
      }
      notify(`Reminder ${reminders} sent`);
      return { ...b, reminders, step };
    });
  }
  function back(id: string) {
    patch(id, (b) => ({ ...b, step: Math.max(0, b.step - 1), status: 'active' }));
  }
  function skip(stage: string) {
    notify(`Stage skipped to ${stage}`);
  }
  function del(id: string) {
    setBlockers((prev) => prev.filter((b) => b.id !== id));
    notify('Blocker removed');
  }
  function reopen(id: string) {
    patch(id, (b) => ({ ...b, status: 'active', step: Math.max(1, b.totalSteps - 1) }));
    notify('Blocker reopened');
  }
  function addBlocker(title: string, description: string) {
    const nb: Blocker = {
      id: 'b' + Date.now(),
      title,
      stage: 'PIA Audit',
      days: 0,
      description,
      statusLabel: 'Documentation Requested',
      step: 1,
      totalSteps: BLOCKER_TOTAL_STEPS,
      reminders: 0,
      status: 'active',
      expanded: true,
    };
    setBlockers((prev) => [nb, ...prev]);
    setAddOpen(false);
    notify('Blocker added');
  }

  return (
    <div className="stage-panel">
      {/* Current Stage Details */}
      <div className="sp-col">
        <div className="sp-h">Current Stage Details</div>
        <div className="sp-kv">
          <span className="sp-k">Stage</span>
          <span className="sp-v">Audit · PIA Assignment</span>
        </div>
        <div className="sp-kv">
          <span className="sp-k">Assignee</span>
          <span className="sp-v">Aisha Khan</span>
        </div>
        <div className="sp-kv">
          <span className="sp-k">Started · SLA</span>
          <span className="sp-v">Jan 23, 2025 · due in 9 days</span>
        </div>
        <div className="sp-desc">
          Reviewing itemized-bill line items for level-of-care and coding accuracy before the claim
          advances to provider reporting.
        </div>
      </div>

      {/* Blockers */}
      <div className="sp-col blockers">
        <div className="sp-h">
          <span>
            Blockers <span className="cnt">· {visibleBlockers.length}</span>
          </span>
          {resolvedCount > 0 && (
            <button
              className="btn btn-ghost btn-xs sp-h-btn"
              onClick={() => setHideResolved((v) => !v)}
            >
              {hideResolved ? 'Show resolved' : 'Hide resolved'}
            </button>
          )}
        </div>
        <button className="add-blocker" onClick={() => setAddOpen(true)}>
          <Icon name="plus" size={16} sw={2} /> Add blocker
        </button>
        <div className="blockers-list">
          {visibleBlockers.map((b) => (
            <BlockerCard
              key={b.id}
              blocker={b}
              stages={SKIP_STAGES}
              onToggle={() => toggle(b.id)}
              onAdvance={() => advance(b.id)}
              onBack={() => back(b.id)}
              onSkip={(stage) => skip(stage)}
              onDelete={() => del(b.id)}
              onReopen={() => reopen(b.id)}
            />
          ))}
        </div>
      </div>

      {/* Move Stage */}
      <div className="sp-col">
        <div className="sp-h">Move Stage</div>
        <div className="sp-move">
          <button
            className={cx('btn btn-outline', activeCount > 0 && 'inert')}
            onClick={() => notify('Claim moved to Provider Reporting')}
          >
            Next Stage: Provider Reporting
          </button>
          <button className="btn btn-outline" onClick={() => notify('Skipped to Client Reporting')}>
            Skip to: Client Reporting
          </button>
          <button
            className="btn btn-outline"
            onClick={() => notify('Claim moved back to previous stage')}
          >
            Go back to Previous Stage
          </button>
          <select
            className="inp"
            value=""
            aria-label="All stages"
            onChange={(e) => {
              if (e.target.value) notify(`Claim moved to ${e.target.value}`);
            }}
          >
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {activeCount > 0 && (
            <div className="hint">
              <Icon name="alert" size={13} sw={2} />
              Resolve {activeCount} active blocker{activeCount === 1 ? '' : 's'} to advance.
            </div>
          )}
        </div>
      </div>

      {addOpen && <AddBlockerModal onClose={() => setAddOpen(false)} onAdd={addBlocker} />}
    </div>
  );
}

function AddBlockerModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (title: string, description: string) => void;
}) {
  const [type, setType] = useState(BLOCKER_TYPES[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog sm" role="dialog" aria-modal="true" aria-label="Add blocker">
        <div className="dlg-head">
          <h2 className="dlg-title">Add blocker</h2>
          <p className="dlg-sub">Flag something that's preventing this claim from advancing.</p>
          <button className="dlg-x" onClick={onClose} aria-label="Close">
            <Icon name="x" size={17} sw={2} />
          </button>
        </div>
        <div className="dlg-body">
          <div className="form-grid">
            <div className="field full">
              <label>Blocker type</label>
              <select className="inp" value={type} onChange={(e) => setType(e.target.value)}>
                {BLOCKER_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="field full">
              <label>Description</label>
              <textarea
                className="inp"
                placeholder="What's blocking the claim and what's needed to clear it…"
                value={description}
                autoFocus
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="dlg-foot">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => onAdd(type, description.trim())}>
            <Icon name="plus" size={15} sw={2} /> Add blocker
          </button>
        </div>
      </div>
    </div>
  );
}
