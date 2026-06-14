import { Icon, cx } from './ui';
import { type Blocker } from './data';

export function BlockerCard({
  blocker,
  stages,
  onToggle,
  onAdvance,
  onBack,
  onSkip,
  onDelete,
  onReopen,
}: {
  blocker: Blocker;
  stages: string[];
  onToggle: () => void;
  onAdvance: () => void;
  onBack: () => void;
  onSkip: (stage: string) => void;
  onDelete: () => void;
  onReopen: () => void;
}) {
  const b = blocker;
  const resolved = b.status === 'resolved';
  const filled = resolved ? b.totalSteps : b.step;
  const pillLabel = resolved ? 'Resolved' : b.statusLabel;
  const meta = `${b.stage} · ${b.days} ${b.days === 1 ? 'day' : 'days'}`;

  const pill = (
    <span className={cx('bk-pill', resolved ? 'resolved' : 'active')}>
      <Icon name={resolved ? 'checkCheck' : 'sun'} size={13} sw={2.2} />
      {pillLabel}
    </span>
  );

  return (
    <div className={cx('blocker', b.status)}>
      {/* header — title (expanded) or status pill (collapsed), meta + chevron */}
      <div className="bk-head" onClick={onToggle}>
        {b.expanded ? <span className="bk-title">{b.title}</span> : pill}
        <span className="bk-head-right">
          <span className="bk-meta">{meta}</span>
          <button
            className="bk-chev"
            title={b.expanded ? 'Collapse' : 'Expand'}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            <Icon name={b.expanded ? 'chevronUp' : 'chevronDown'} size={18} sw={2} />
          </button>
        </span>
      </div>

      {b.expanded && (
        <div className="bk-body">
          <div className="bk-desc">{b.description}</div>

          <div className="bk-stepbars">
            {Array.from({ length: b.totalSteps }).map((_, i) => (
              <i className={cx(i < filled && 'done')} key={i} />
            ))}
          </div>

          {pill}

          <div className="bk-actions">
            <button className="btn btn-outline btn-xs danger" onClick={onDelete}>
              Delete
            </button>
            {resolved ? (
              <button className="btn btn-outline btn-xs" onClick={onReopen}>
                <Icon name="reopen" size={13} sw={2} /> Reopen
              </button>
            ) : (
              <>
                <button className="btn btn-outline btn-xs" onClick={onBack}>
                  Go Back
                </button>
                <select
                  className="bk-skip"
                  value=""
                  aria-label="Skip to stage"
                  onChange={(e) => {
                    if (e.target.value) onSkip(e.target.value);
                  }}
                >
                  <option value="">Skip Stage</option>
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button className="btn btn-outline btn-xs" onClick={onAdvance}>
                  <Icon name="arrowRight" size={13} sw={2} />
                  {b.reminders > 0 ? `Reminder ${b.reminders} Sent` : 'Send Reminder'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
