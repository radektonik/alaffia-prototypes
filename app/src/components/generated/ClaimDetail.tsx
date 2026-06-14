import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon, cx, type CheckState } from './ui';
import { ClaimHeader } from './ClaimHeader';
import { ClaimToolbar } from './ClaimToolbar';
import { ItemsTable } from './ItemsTable';
import { UBView } from './UBView';
import { StagePanel } from './StagePanel';
import { EditModal, CreateModal } from './FindingsModals';
import {
  buildItems,
  buildCombos,
  toCombo,
  INITIAL_DET_SAVINGS,
  type Item,
  type Finding,
  type Status,
  type Combo,
} from './data';

const SIDEBAR_NAV = [
  { icon: 'bell', title: 'Notifications' },
  { icon: 'home', title: 'Home' },
  { icon: 'claims', title: 'Claims', active: true },
  { icon: 'documents', title: 'Documents' },
  { icon: 'upload', title: 'Upload' },
  { icon: 'auditlog', title: 'Audit log' },
];

const TABS = ['Details', 'DRG', 'UB', 'IB', 'Findings', 'Reports'];

// Proportional column sizing — CSS calc() isn't honored on <col> widths,
// so the flexible columns share width beyond the 1308px floor in JS.
const COL_BASE = [72, 64, 24, 110, 120, 108, 105, 89, 100, 69, 116, 113, 218];
const COL_FIXED = new Set([0, 1, 2, 9]);
const COL_FLOOR = COL_BASE.reduce((a, b) => a + b, 0);
const COL_FLEX = COL_BASE.reduce((a, b, i) => a + (COL_FIXED.has(i) ? 0 : b), 0);

export const ClaimDetail = () => {
  const [items, setItems] = useState<Item[]>(buildItems);
  const [selItems, setSelItems] = useState<Set<string>>(new Set());
  const [selFindings, setSelFindings] = useState<Set<string>>(new Set());
  const [density, setDensity] = useState<'comfy' | 'compact'>('comfy');
  const [query, setQuery] = useState('');
  const [seg, setSeg] = useState<'items' | 'rules'>('items');
  const [ubDos, setUbDos] = useState(false);
  const [activeTab, setActiveTab] = useState('UB');
  const [panelOpen, setPanelOpen] = useState(true);
  const [detSavings, setDetSavings] = useState(INITIAL_DET_SAVINGS);
  const [editCombos, setEditCombos] = useState<Combo[] | null>(null);
  const [createCount, setCreateCount] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const zoneRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // proportional column sizing
  useEffect(() => {
    const size = () => {
      const sc = scrollRef.current;
      const zone = zoneRef.current;
      if (!sc || !zone) return;
      const extra = Math.max(0, sc.clientWidth - COL_FLOOR);
      COL_BASE.forEach((base, i) => {
        const w = COL_FIXED.has(i) ? base : base + extra * (base / COL_FLEX);
        zone.style.setProperty('--w' + (i + 1), w.toFixed(2) + 'px');
      });
    };
    size();
    const ro = new ResizeObserver(size);
    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, []);

  const allFindings = useMemo(() => items.flatMap((it) => it.findings), [items]);
  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.no.includes(q) || it.desc.toLowerCase().includes(q));
  }, [items, query]);

  const headItems: CheckState =
    selItems.size === 0 ? 'unchecked' : selItems.size >= items.length ? 'checked' : 'indeterminate';
  const headFindings: CheckState =
    selFindings.size === 0
      ? 'unchecked'
      : selFindings.size >= allFindings.length
        ? 'checked'
        : 'indeterminate';

  /* ===== selection (Variant C — items and findings are mutually exclusive) ===== */
  function toggleItem(id: string) {
    if (selFindings.size > 0) return;
    setSelItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleFinding(id: string) {
    if (selItems.size > 0) return;
    setSelFindings((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function headToggleItems() {
    if (selFindings.size > 0) return;
    setSelItems(selItems.size >= items.length ? new Set() : new Set(items.map((i) => i.id)));
  }
  function headToggleFindings() {
    if (selItems.size > 0) return;
    if (selFindings.size >= allFindings.length) {
      setSelFindings(new Set());
      return;
    }
    setItems((prev) => prev.map((it) => (it.findings.length ? { ...it, expanded: true } : it)));
    setSelFindings(new Set(allFindings.map((f) => f.id)));
  }
  function clearSelection() {
    setSelItems(new Set());
    setSelFindings(new Set());
  }

  function toggleExpand(id: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, expanded: !it.expanded } : it)));
  }

  function setFindingStatus(predicate: (f: Finding) => boolean, to: Status) {
    let delta = 0;
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        findings: it.findings.map((f) => {
          if (!predicate(f)) return f;
          if (to === 'accepted' && f.status !== 'accepted') delta += f.savings;
          if (to !== 'accepted' && f.status === 'accepted') delta -= f.savings;
          return { ...f, status: to };
        }),
      })),
    );
    if (delta) setDetSavings((s) => s + delta);
  }

  function acceptOne(fid: string) {
    const f = allFindings.find((x) => x.id === fid);
    if (!f) return;
    setFindingStatus((x) => x.id === fid, f.status === 'accepted' ? 'suggested' : 'accepted');
  }
  function acceptSelected() {
    setFindingStatus((f) => selFindings.has(f.id), 'accepted');
    setSelFindings(new Set());
  }
  function editSelected() {
    setEditCombos(buildCombos(allFindings.filter((f) => selFindings.has(f.id))));
  }
  function editOne(f: Finding) {
    setEditCombos([toCombo(f, 1)]);
  }
  function createForSelected() {
    setCreateCount(selItems.size);
  }

  const isF = selFindings.size > 0;
  const selCount = isF ? selFindings.size : selItems.size;
  const barShown = selCount > 0;

  return (
    <div className="app">
      {/* ===== sidebar ===== */}
      <aside className="sidebar">
        <div className="logo" title="Alaffia">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M12 2.5 2.5 21h6.2l3.3-6.6 3.3 6.6h6.2L12 2.5Z" fill="currentColor" />
            <path d="M12 10.2 9.4 15h5.2L12 10.2Z" fill="#fff" />
          </svg>
        </div>
        {SIDEBAR_NAV.map((n) => (
          <button key={n.title} className={cx('nav-i', n.active && 'active')} title={n.title}>
            <Icon name={n.icon} size={20} />
          </button>
        ))}
        <div className="spacer" />
        <button className="nav-i" title="Settings">
          <Icon name="settings" size={20} />
        </button>
        <div className="avatar">AT</div>
      </aside>

      {/* ===== main ===== */}
      <div className="main">
        <div className="topbar">
          <button className="tb-toggle" title="Toggle sidebar">
            <Icon name="panel" size={18} />
          </button>
          <div className="tb-sep" />
          <nav className="crumb">
            <span className="root">Claims</span>
            <span className="sep">
              <Icon name="chevronRight" size={15} sw={2} />
            </span>
            <span className="cur">Claim: dc00007</span>
          </nav>
        </div>

        <div className="content">
          <ClaimHeader
            detSavings={detSavings}
            panelOpen={panelOpen}
            onTogglePanel={() => setPanelOpen((v) => !v)}
            panel={<StagePanel notify={notify} />}
          />

          <nav className="tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={cx('tab', activeTab === t && 'active')}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>

          {activeTab === 'UB' && <UBView density={density} onDensity={setDensity} />}

          {activeTab === 'IB' && (
            <>
              <ClaimToolbar
                query={query}
                onQuery={setQuery}
                seg={seg}
                onSeg={setSeg}
                ubDos={ubDos}
                onUbDos={setUbDos}
                density={density}
                onDensity={setDensity}
              />
              <ItemsTable
                items={visibleItems}
                selItems={selItems}
                selFindings={selFindings}
                density={density}
                headItems={headItems}
                headFindings={headFindings}
                onHeadItems={headToggleItems}
                onHeadFindings={headToggleFindings}
                onToggleItem={toggleItem}
                onToggleFinding={toggleFinding}
                onToggleExpand={toggleExpand}
                onAccept={acceptOne}
                onEdit={editOne}
                zoneRef={zoneRef}
                scrollRef={scrollRef}
              />
            </>
          )}

          {activeTab !== 'UB' && activeTab !== 'IB' && (
            <div className="tab-empty">
              <Icon name="info" size={22} />
              <p>The {activeTab} view isn't part of this prototype yet.</p>
              <p className="sub">Open the IB or UB tab to see worked line items.</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== floating action bar ===== */}
      <div className={cx('actionbar', barShown && 'show')} role="region" aria-label="Selection actions">
        <span className="ab-count">
          Selected {selCount} {isF ? 'Finding' : 'Item'}
          {selCount === 1 ? '' : 's'}
        </span>
        <button className="ab-clear" onClick={clearSelection}>
          Clear
        </button>
        <div className="ab-div" />
        <div className="ab-actions">
          {isF ? (
            <>
              <button className="btn btn-soft" onClick={acceptSelected}>
                <Icon name="check" size={15} sw={2.2} /> Accept Suggestions
              </button>
              <button className="btn btn-outline" onClick={editSelected}>
                <Icon name="pencil" size={15} /> Edit Suggestions
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={createForSelected}>
              <Icon name="bulb" size={15} sw={2} /> Create Findings
            </button>
          )}
        </div>
      </div>

      {/* ===== modals ===== */}
      {editCombos && <EditModal initialCombos={editCombos} onClose={() => setEditCombos(null)} />}
      {createCount !== null && (
        <CreateModal count={createCount} onClose={() => setCreateCount(null)} />
      )}

      {/* ===== toast ===== */}
      {toast && (
        <div className="toast" role="status">
          <span className="ic">
            <Icon name="check" size={16} sw={2.4} />
          </span>
          {toast}
        </div>
      )}
    </div>
  );
};
