import { useEffect, useState } from 'react';
import { Icon } from './ui';
import { money, type Combo } from './data';

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
}

/* ===== Edit findings modal ===== */
export function EditModal({
  initialCombos,
  onClose,
}: {
  initialCombos: Combo[];
  onClose: () => void;
}) {
  const [combos, setCombos] = useState<Combo[]>(initialCombos);
  const [removing, setRemoving] = useState<number | null>(null);
  useEscape(onClose);

  const total = combos.reduce((a, c) => a + c.count, 0);

  function exclude(idx: number) {
    setRemoving(idx);
    setTimeout(() => {
      setCombos((cs) => {
        const next = cs.filter((_, i) => i !== idx);
        if (!next.length) onClose();
        return next;
      });
      setRemoving(null);
    }, 140);
  }

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Edit findings">
        <div className="dlg-head">
          <h2 className="dlg-title">Edit Findings ({total})</h2>
          <p className="dlg-sub">
            Shared values apply to all. Exclude combinations to narrow, or use Overwrite all below.
          </p>
          <button className="dlg-x" onClick={onClose} aria-label="Close">
            <Icon name="x" size={17} sw={2} />
          </button>
        </div>
        <div className="dlg-body">
          <div className="section-h">
            Finding combinations <span className="cnt">· {combos.length} distinct</span>
          </div>
          <div className="combos">
            <table className="cmb">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Count</th>
                  <th>Den Code</th>
                  <th>Rev Code</th>
                  <th className="num">D Qty</th>
                  <th className="num">D Billed</th>
                  <th className="num">Det Savings</th>
                  <th>Rationale</th>
                  <th style={{ width: 96 }} />
                </tr>
              </thead>
              <tbody>
                {combos.map((c, idx) => (
                  <tr className={removing === idx ? 'removing' : undefined} key={`${c.den}-${idx}`}>
                    <td>
                      <span className="count-badge">{c.count}×</span>
                    </td>
                    <td>
                      <span className="den pink">{c.den}</span>
                    </td>
                    <td>{c.rev}</td>
                    <td className="num">{c.qty}</td>
                    <td className="num">{money(c.billed)}</td>
                    <td className="num">
                      <span className="savings">{money(c.savings)}</span>
                    </td>
                    <td>
                      <div className="rationale">{c.rationale}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-exclude" onClick={() => exclude(idx)}>
                        <Icon name="x" size={13} sw={2.2} /> Exclude
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overwrite">
            <div className="section-h">
              Overwrite all <span className="cnt">· optional</span>
            </div>
            <p className="ow-note">Leave blank to keep existing values.</p>
            <div className="form-grid">
              <div className="field">
                <label>Status</label>
                <select className="inp" defaultValue="Keep current">
                  <option>Keep current</option>
                  <option>Suggested</option>
                  <option>Accepted</option>
                  <option>Declined</option>
                </select>
              </div>
              <div className="field">
                <label>Rev Code</label>
                <input className="inp" placeholder="Keep current" />
              </div>
              <div className="field">
                <label>Denial Code</label>
                <select className="inp" defaultValue="Keep current">
                  <option>Keep current</option>
                  <option>OL — Level of Care</option>
                  <option>OR — Upcoding / Reduction</option>
                  <option>OF — Unit / Frequency</option>
                </select>
              </div>
              <div className="field" />
              <div className="field full">
                <label>Rationale</label>
                <textarea className="inp" placeholder="Keep current rationale…" />
              </div>
              <div className="fin-impact">
                <div className="imp-h">Financial Impact</div>
                <div className="qty-row">
                  <label>Discrepant Quantity</label>
                  <input className="inp" type="number" placeholder="Keep current" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="dlg-foot">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Edit {total} Findings
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Create findings modal ===== */
export function CreateModal({ count, onClose }: { count: number; onClose: () => void }) {
  const [reprice, setReprice] = useState(false);
  useEscape(onClose);

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog sm" role="dialog" aria-modal="true" aria-label="Create findings">
        <div className="dlg-head">
          <h2 className="dlg-title">Create Findings</h2>
          <p className="dlg-sub">
            Creating findings for <b>{count}</b> item{count === 1 ? '' : 's'}. The same values apply
            to every selected line item.
          </p>
          <button className="dlg-x" onClick={onClose} aria-label="Close">
            <Icon name="x" size={17} sw={2} />
          </button>
        </div>
        <div className="dlg-body">
          <div className="form-grid">
            <div className="field full">
              <label>Denial Code</label>
              <select className="inp" defaultValue="">
                <option value="">Select a denial code…</option>
                <option>OL — Level of Care Not Appropriate</option>
                <option>OR — Upcoding / Reduction</option>
                <option>OF — Unit / Frequency Limit</option>
              </select>
            </div>
            <div className="field full">
              <label>Rationale</label>
              <textarea className="inp" placeholder="Explain the basis for these findings…" />
            </div>
            <div className="field full">
              <label>Rev Code</label>
              <input className="inp" placeholder="e.g. 0202" />
            </div>
            <div className="fin-impact">
              <div className="imp-h">Financial Impact</div>
              <label className="check-line" onClick={() => setReprice((v) => !v)}>
                <span className="cb" data-state={reprice ? 'checked' : 'unchecked'}>
                  <svg className="ck" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <svg className="mn" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14" />
                  </svg>
                </span>
                <span>Reprice — recalculate the allowed amount for this charge</span>
              </label>
              <div className="qty-row">
                <label>Discrepant Quantity</label>
                <input className="inp" type="number" placeholder="0" />
              </div>
            </div>
          </div>
        </div>
        <div className="dlg-foot">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Create {count} Finding{count === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  );
}
