import { Icon, cx } from './ui';

export function ClaimToolbar({
  query,
  onQuery,
  seg,
  onSeg,
  ubDos,
  onUbDos,
  density,
  onDensity,
}: {
  query: string;
  onQuery: (v: string) => void;
  seg: 'items' | 'rules';
  onSeg: (v: 'items' | 'rules') => void;
  ubDos: boolean;
  onUbDos: (v: boolean) => void;
  density: 'comfy' | 'compact';
  onDensity: (v: 'comfy' | 'compact') => void;
}) {
  return (
    <div className="toolbar">
      <div className="search">
        <Icon name="search" sw={2} />
        <input
          type="text"
          placeholder="Search Items..."
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>

      <div className="segmented">
        <button className={cx(seg === 'items' && 'active')} onClick={() => onSeg('items')}>
          Items
        </button>
        <button className={cx(seg === 'rules' && 'active')} onClick={() => onSeg('rules')}>
          Rules
        </button>
      </div>

      <span className="tb-label">Findings</span>

      <button className="sel">
        <span>All Statuses</span>
        <Icon name="chevronDown" size={15} sw={2} />
      </button>
      <button className="sel">
        <span>All Rules</span>
        <Icon name="chevronDown" size={15} sw={2} />
      </button>

      <label className="switch-line" onClick={() => onUbDos(!ubDos)}>
        <span className={cx('switch', ubDos && 'on')} />
        Only UB DoS
      </label>

      <div className="spring" />

      <div className="density">
        <button
          className={cx(density === 'compact' && 'on')}
          title="Compact density"
          onClick={() => onDensity('compact')}
        >
          <Icon name="densityCompact" />
        </button>
        <button
          className={cx(density === 'comfy' && 'on')}
          title="Comfortable density"
          onClick={() => onDensity('comfy')}
        >
          <Icon name="densityComfy" />
        </button>
      </div>
    </div>
  );
}
