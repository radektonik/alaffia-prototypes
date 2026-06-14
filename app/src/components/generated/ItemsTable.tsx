import type { Ref, MouseEvent, ReactNode } from 'react';
import { Icon, Checkbox, cx, type CheckState } from './ui';
import { money, cap, itemState, type Item, type Finding } from './data';

function ColGroup() {
  return (
    <colgroup>
      {Array.from({ length: 13 }, (_, i) => (
        <col className={`g${i + 1}`} key={i} />
      ))}
    </colgroup>
  );
}

export interface ItemsTableProps {
  items: Item[];
  selItems: Set<string>;
  selFindings: Set<string>;
  density: 'comfy' | 'compact';
  headItems: CheckState;
  headFindings: CheckState;
  onHeadItems: () => void;
  onHeadFindings: () => void;
  onToggleItem: (id: string) => void;
  onToggleFinding: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onAccept: (fid: string) => void;
  onEdit: (f: Finding) => void;
  zoneRef: Ref<HTMLDivElement>;
  scrollRef: Ref<HTMLDivElement>;
}

export function ItemsTable(props: ItemsTableProps) {
  const { items, selItems, selFindings, density, zoneRef, scrollRef } = props;
  const itemsLocked = selFindings.size > 0;
  const findingsLocked = selItems.size > 0;

  function rowClick(e: MouseEvent, it: Item) {
    if ((e.target as HTMLElement).closest('.cb, button')) return;
    if (it.findings.length) props.onToggleExpand(it.id);
  }

  return (
    <div className="table-zone" ref={zoneRef}>
      <div className="table-scroll" ref={scrollRef}>
        <table className={cx('ib', density === 'compact' && 'compact')}>
          <ColGroup />
          <thead>
            <tr>
              <th className="col-cb">
                <span className="cbhead">
                  <Checkbox
                    state={props.headItems}
                    onToggle={props.onHeadItems}
                    inert={itemsLocked}
                    label="Select all items"
                  />
                  Items
                </span>
              </th>
              <th className="col-find" colSpan={2}>
                <span className="cbhead">
                  <Checkbox
                    state={props.headFindings}
                    onToggle={props.onHeadFindings}
                    inert={findingsLocked}
                    label="Select all findings"
                  />
                  Findings
                </span>
              </th>
              <th className="rev-c">Rev</th>
              <th>Item No.</th>
              <th>Description</th>
              <th>Procedure</th>
              <th>Proc mode</th>
              <th>DoS</th>
              <th className="qty-c">Qty</th>
              <th className="num">Billed</th>
              <th className="num">Det. Savings</th>
              <th>Denial Code</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const st = itemState(it);
              const isSel = selItems.has(it.id);
              const accepted = it.findings.filter((f) => f.status === 'accepted');
              const accSavings = accepted.reduce((a, f) => a + f.savings, 0);
              const denCodes = [...new Set(accepted.map((f) => f.den))];
              const hasF = it.findings.length > 0;

              return (
                <FragmentRow key={it.id}>
                  <tr
                    className={cx('item', `st-${st}`, isSel && 'sel-row')}
                    onClick={(e) => rowClick(e, it)}
                  >
                    <td className="col-cb">
                      <Checkbox
                        state={isSel ? 'checked' : 'unchecked'}
                        onToggle={() => props.onToggleItem(it.id)}
                        inert={itemsLocked}
                        label={`Select item ${it.no}`}
                      />
                    </td>
                    <td className="col-chev">
                      <button
                        className={cx('chev', it.expanded && 'open')}
                        onClick={() => hasF && props.onToggleExpand(it.id)}
                        title={it.expanded ? 'Collapse' : 'Expand'}
                      >
                        <Icon name="chevronRight" sw={2} />
                      </button>
                    </td>
                    <td className="col-no dim">{it.findings.length}</td>
                    <td className="rev-c">{it.rev}</td>
                    <td>{it.no}</td>
                    <td>{it.desc}</td>
                    <td className="dash">–</td>
                    <td className="dash">–</td>
                    <td>{it.dos}</td>
                    <td className="qty-c">{it.qty}</td>
                    <td className="num">{money(it.billed)}</td>
                    <td className="num">
                      {accSavings > 0 ? (
                        <span className="savings">{money(accSavings)}</span>
                      ) : (
                        <span className="dash">–</span>
                      )}
                    </td>
                    <td>
                      {denCodes.length ? (
                        <div className="den-wrap">
                          {denCodes.map((d) => (
                            <span className="den blue" key={d}>
                              {d}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="dash">–</span>
                      )}
                    </td>
                  </tr>
                  {it.expanded && hasF && (
                    <tr className="sub-row">
                      <td colSpan={13} className="sub-cell">
                        <SubTable
                          it={it}
                          density={density}
                          selFindings={selFindings}
                          findingsLocked={findingsLocked}
                          onToggleFinding={props.onToggleFinding}
                          onAccept={props.onAccept}
                          onEdit={props.onEdit}
                        />
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
  );
}

// table rows can't be wrapped in <div>; use a keyed fragment helper
function FragmentRow({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function SubTable({
  it,
  density,
  selFindings,
  findingsLocked,
  onToggleFinding,
  onAccept,
  onEdit,
}: {
  it: Item;
  density: 'comfy' | 'compact';
  selFindings: Set<string>;
  findingsLocked: boolean;
  onToggleFinding: (id: string) => void;
  onAccept: (fid: string) => void;
  onEdit: (f: Finding) => void;
}) {
  return (
    <table className={cx('sub', density === 'compact' && 'compact')}>
      <ColGroup />
      <thead>
        <tr>
          <th className="lead" colSpan={3} />
          <th className="rev-c">Rev</th>
          <th>Denial Code</th>
          <th colSpan={3}>Created by</th>
          <th>Created</th>
          <th className="qty-c">Disc. Qty</th>
          <th className="num">Disc. Billed</th>
          <th className="num">Det. Savings</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {it.findings.map((f) => {
          const sel = selFindings.has(f.id);
          return (
            <tr className={cx(sel && 'f-sel')} key={f.id}>
              <td />
              <td className="sc">
                <Checkbox
                  state={sel ? 'checked' : 'unchecked'}
                  onToggle={() => onToggleFinding(f.id)}
                  inert={findingsLocked}
                  label={`Select finding ${f.den}`}
                />
              </td>
              <td className="sc">
                <span className="chev" style={{ cursor: 'default' }}>
                  <Icon name="chevronRight" sw={2} />
                </span>
              </td>
              <td className="rev-c">{f.rev}</td>
              <td>
                <span className="den pink">{f.den}</span>
              </td>
              <td colSpan={3}>
                <span className="created-by">
                  <span className={`rule-ava ${f.avatar}`}>
                    <Icon name="clip" size={13} />
                  </span>
                  {f.rule}
                </span>
              </td>
              <td className="dim">{f.created}</td>
              <td className="qty-c">{f.qty}</td>
              <td className="num">{money(f.billed)}</td>
              <td className="num">
                <span className="savings">{money(f.savings)}</span>
              </td>
              <td>
                <div className="f-status">
                  <span className={`pill ${f.status}`}>
                    {f.status === 'suggested' && <Icon name="bulb" size={11} sw={2} />}
                    {cap(f.status)}
                  </span>
                  <span className="f-actions">
                    <button
                      className="fab acc"
                      title="Accept"
                      onClick={() => onAccept(f.id)}
                    >
                      <Icon name="check" size={15} sw={2.2} />
                    </button>
                    <button className="fab edt" title="Edit" onClick={() => onEdit(f)}>
                      <Icon name="pencil" size={14} />
                    </button>
                  </span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
