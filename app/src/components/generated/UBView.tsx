import { useMemo, useState, type ReactNode } from 'react';
import { Icon, cx } from './ui';
import { buildUBLines, money, type UBLine } from './data';

const rate = (r: number) => `${Math.round(r * 100)}%`;

export function UBView({
  density,
  onDensity,
}: {
  density: 'comfy' | 'compact';
  onDensity: (d: 'comfy' | 'compact') => void;
}) {
  const [lines, setLines] = useState<UBLine[]>(buildUBLines);
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter(
      (l) =>
        l.desc.toLowerCase().includes(q) ||
        l.service.toLowerCase().includes(q) ||
        l.proc.toLowerCase().includes(q) ||
        l.rev.includes(q),
    );
  }, [lines, query]);

  const toggle = (id: string) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, expanded: !l.expanded } : l)));

  const COLSPAN = 11;

  return (
    <>
      {/* toolbar — same pattern (search + column controls) */}
      <div className="toolbar">
        <div className="search">
          <Icon name="search" sw={2} />
          <input
            type="text"
            placeholder="Search UB lines..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
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

      {/* table + rail */}
      <div className="table-zone">
        <div className="table-scroll">
          <table className={cx('ub', density === 'compact' && 'compact')}>
            <thead>
              <tr>
                <th className="col-chev" />
                <th>Rev</th>
                <th>Description</th>
                <th>Procedure Code</th>
                <th>Service Name</th>
                <th className="num">Qty</th>
                <th className="num">Payment Rate</th>
                <th className="num">Billed</th>
                <th className="num">Adj. Billed</th>
                <th className="num">Adj. Allowed</th>
                <th>Denial Code</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((l) => {
                const worked = l.denial !== null;
                return (
                  <FragmentRow key={l.id}>
                    <tr className={cx('line', l.expanded && 'open')} onClick={() => toggle(l.id)}>
                      <td className="col-chev">
                        <button
                          className={cx('chev', l.expanded && 'open')}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(l.id);
                          }}
                          title={l.expanded ? 'Collapse' : 'Expand'}
                        >
                          <Icon name="chevronRight" sw={2} />
                        </button>
                      </td>
                      <td>{l.rev}</td>
                      <td>{l.desc}</td>
                      <td>{l.proc}</td>
                      <td>{l.service}</td>
                      <td className="num">{l.qty}</td>
                      <td className="num">{rate(l.rate)}</td>
                      <td className="num">{money(l.billed)}</td>
                      <td className="num">
                        {l.adjBilled !== null ? money(l.adjBilled) : <span className="empty">–</span>}
                      </td>
                      <td className="num">
                        {l.adjAllowed !== null ? (
                          <span className="savings">{money(l.adjAllowed)}</span>
                        ) : (
                          <span className="empty">–</span>
                        )}
                      </td>
                      <td>
                        {l.denial ? (
                          <span className="den pink">{l.denial}</span>
                        ) : (
                          <span className="empty">–</span>
                        )}
                      </td>
                    </tr>
                    {l.expanded && (
                      <tr className="ub-detail">
                        <td colSpan={COLSPAN}>
                          <div className="ub-detail-inner">
                            <div>
                              <div className="ub-dt">Original allowed</div>
                              <div className="ub-dv">{money(l.detail.origAllowed)}</div>
                            </div>
                            <div>
                              <div className="ub-dt">Adjustment reason</div>
                              <div className="ub-dv">
                                {worked ? l.detail.adjustmentReason : <span className="empty">Not yet worked</span>}
                              </div>
                            </div>
                            <div>
                              <div className="ub-dt">Modifiers</div>
                              <div className="ub-dv">
                                {l.detail.modifiers || <span className="empty">None</span>}
                              </div>
                            </div>
                            <div>
                              <div className="ub-dt">Remit code</div>
                              <div className="ub-dv">
                                {l.detail.remit || <span className="empty">–</span>}
                              </div>
                            </div>
                            {worked && (
                              <div className="ub-dv rationale">
                                <span className="ub-dt">Rationale</span>
                                <br />
                                {l.detail.rationale}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rail">
          <button className="r-col" title="Columns">
            <Icon name="columns" />
            <span className="vtext">Columns</span>
          </button>
          <button className="r-fil" title="Filters">
            <Icon name="filter" />
            <span className="vtext">Filters</span>
          </button>
          <button className="r-id" title="IDs">
            <Icon name="ids" />
            <span className="vtext">IDs</span>
          </button>
        </div>
      </div>
    </>
  );
}

function FragmentRow({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
