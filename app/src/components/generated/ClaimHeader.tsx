import type { ReactNode } from 'react';
import { Icon } from './ui';
import { money } from './data';

type StageState = 'done' | 'cur' | 'todo';
interface Stage {
  label: string;
  state: StageState;
  bars: Array<'' | 'g' | 'a' | 'p'>;
}

const STAGES: Stage[] = [
  { label: 'Intake', state: 'done', bars: ['g', 'g', 'a', 'a'] },
  { label: 'Audit', state: 'cur', bars: ['p', '', '', ''] },
  { label: 'Provider Reporting', state: 'todo', bars: ['', '', '', ''] },
  { label: 'Dispute', state: 'todo', bars: ['', ''] },
  { label: 'Client Reporting', state: 'todo', bars: ['', '', '', ''] },
  { label: 'Appeals', state: 'todo', bars: ['', '', '', '', '', '', ''] },
  { label: 'Closed', state: 'todo', bars: [''] },
];

export function ClaimHeader({
  detSavings,
  panelOpen,
  onTogglePanel,
  panel,
}: {
  detSavings: number;
  panelOpen: boolean;
  onTogglePanel: () => void;
  panel: ReactNode;
}) {
  return (
    <section className="claim-card">
      {/* header band */}
      <div className="claim-head">
        <div className="claim-id">dc00007</div>
        <button className="hbtn" title="Documents">
          <Icon name="file" />
        </button>
        <button className="hbtn" title="Knowledge">
          <Icon name="knowledge" />
        </button>
        <button className="hbtn" title="Info">
          <Icon name="info" />
        </button>
        <button className="btn btn-primary">
          Claim Actions
          <Icon name="chevronDown" sw={2} />
        </button>
      </div>

      {/* details panel */}
      <div className="claim-details">
        <div className="det-cell">
          <div className="det-label">Audit Type</div>
          <span className="badge-audit">DRG</span>
        </div>
        <div className="det-cell">
          <div className="det-label">Client</div>
          <div className="det-val">Blue Horizon</div>
        </div>
        <div className="det-cell">
          <div className="det-label">Determined Savings</div>
          <div className="det-val savings">{money(detSavings)}</div>
        </div>
        <div className="det-cell assignee">
          <div className="det-inner">
            <div className="det-label">Primary Assignee</div>
            <div className="det-val">Aisha Khan</div>
          </div>
          <button className="det-collapse" title="Collapse">
            <Icon name="chevronUp" sw={2} />
          </button>
        </div>
      </div>

      {/* progress bar */}
      <div className="progress-bar">
        <div className="cur-stage">
          <span className="stage-pill">
            <Icon name="sun" size={12} sw={2.2} />
            PIA Assignment
          </span>
          <span className="stage-days">(5 days)</span>
        </div>
        <div className="pb-divider" />
        <div className="stages">
          {STAGES.map((s) => (
            <div className={`stage ${s.state}`} key={s.label}>
              <div className="lbl">{s.label}</div>
              <div className="bars">
                {s.bars.map((b, i) => (
                  <i className={b} key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          className="pb-chev"
          title={panelOpen ? 'Collapse stage details' : 'Expand stage details'}
          onClick={onTogglePanel}
        >
          <Icon name={panelOpen ? 'chevronUp' : 'chevronDown'} sw={2} />
        </button>
      </div>

      {/* expanded stage panel */}
      {panelOpen && panel}
    </section>
  );
}
