// Claim data model — mirrors the Figma frame (claim dc00007) from index.html.

export type Status = 'suggested' | 'accepted' | 'declined';

export interface Finding {
  id: string;
  rev: string;
  den: string;
  rule: string;
  rationale: string;
  created: string;
  qty: number;
  billed: number;
  savings: number;
  status: Status;
  avatar: 'light' | 'dark';
}

export interface Item {
  id: string;
  idx: number;
  no: string;
  rev: string;
  desc: string;
  dos: string;
  qty: number;
  billed: number;
  expanded: boolean;
  findings: Finding[];
}

export const RULES: Record<string, { rule: string; rationale: string }> = {
  LOC: {
    rule: 'Level of care rule',
    rationale:
      'Level of care not appropriate — documentation does not support ICU-level acuity for this date of service.',
  },
  UPC: {
    rule: 'Upcoding rule',
    rationale: 'Upcoding not justified — record supports a lower acuity level than billed.',
  },
  UNI: {
    rule: 'Exceeding unit limits rule',
    rationale: 'Unit limits exceeded — plan caps R&B ICU at the allowed number of days per stay.',
  },
  BUN: {
    rule: 'Bundling rule',
    rationale: 'Unbundled / incidental charge — not separately reimbursable under the plan.',
  },
  MNC: {
    rule: 'Medical necessity rule',
    rationale: 'Service not medically necessary for the documented condition.',
  },
  DUP: {
    rule: 'Duplicate charge rule',
    rationale: 'Duplicate line item — this charge was already billed on the claim.',
  },
};

type RawFinding = [key: keyof typeof RULES, status: Status, den: string, avatar?: 'light' | 'dark'];

interface RawItem {
  no: string;
  rev: string;
  dos: string;
  billed: number;
  expanded?: boolean;
  f: RawFinding[];
}

const RAW: RawItem[] = [
  { no: '312531001', rev: '0191', dos: '1/18/2021', billed: 2425.0, f: [['LOC', 'suggested', 'OL'], ['UPC', 'suggested', 'OR']] },
  { no: '312531002', rev: '0192', dos: '1/19/2021', billed: 2425.0, f: [['UNI', 'suggested', 'OF'], ['BUN', 'suggested', 'OU']] },
  { no: '312531003', rev: '0193', dos: '1/20/2021', billed: 100.0, f: [['LOC', 'accepted', 'OL'], ['UNI', 'suggested', 'OF']] },
  { no: '312531004', rev: '0194', dos: '1/21/2021', billed: 100.0, f: [['LOC', 'accepted', 'OL'], ['BUN', 'suggested', 'OU']] },
  { no: '312531005', rev: '0195', dos: '1/22/2021', billed: 2425.0, f: [['UPC', 'declined', 'OR'], ['MNC', 'declined', 'MN']] },
  { no: '312531006', rev: '0196', dos: '1/23/2021', billed: 2425.0, f: [['LOC', 'suggested', 'OL'], ['UPC', 'suggested', 'OR'], ['UNI', 'suggested', 'OF']] },
  { no: '312531007', rev: '0197', dos: '1/23/2021', billed: 2425.0, f: [['BUN', 'suggested', 'OU'], ['DUP', 'suggested', 'DC']] },
  { no: '312531008', rev: '0196', dos: '1/23/2021', billed: 2425.0, expanded: true, f: [['LOC', 'suggested', 'OR', 'light'], ['UPC', 'suggested', 'OF', 'light'], ['UNI', 'suggested', 'OL', 'dark']] },
];

export function buildItems(): Item[] {
  return RAW.map((it, i) => ({
    id: 'i' + i,
    idx: i + 1,
    no: it.no,
    rev: it.rev,
    desc: 'R&B ICU',
    dos: it.dos,
    qty: 1,
    billed: it.billed,
    expanded: !!it.expanded,
    findings: it.f.map(([key, status, den, avatar], j) => ({
      id: `f${i}-${j}`,
      rev: '0202',
      den,
      rule: RULES[key].rule,
      rationale: RULES[key].rationale,
      created: '10/10/25',
      qty: 1,
      billed: 2238.28,
      savings: 2238.28,
      status,
      avatar: avatar ?? 'light',
    })),
  }));
}

export const INITIAL_DET_SAVINGS = 196.35;

export const money = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function itemState(it: Item): 'none' | 'accepted' | 'declined' | 'suggested' {
  if (!it.findings.length) return 'none';
  const s = it.findings.map((f) => f.status);
  if (s.includes('accepted')) return 'accepted';
  if (s.every((x) => x === 'declined')) return 'declined';
  if (s.includes('suggested')) return 'suggested';
  return 'none';
}

export interface Combo extends Finding {
  count: number;
}

export function toCombo(f: Finding, count: number): Combo {
  return {
    id: f.id,
    rev: f.rev,
    den: f.den,
    rule: f.rule,
    rationale: f.rationale,
    created: f.created,
    qty: f.qty,
    billed: f.billed,
    savings: f.savings,
    status: f.status,
    avatar: f.avatar,
    count,
  };
}

export function buildCombos(selected: Finding[]): Combo[] {
  const map = new Map<string, Combo>();
  selected.forEach((f) => {
    const key = [f.den, f.rev, f.qty, f.billed, f.savings, f.rationale].join('|');
    if (!map.has(key)) map.set(key, toCombo(f, 0));
    map.get(key)!.count++;
  });
  return [...map.values()].sort((a, b) => a.den.localeCompare(b.den) || b.billed - a.billed);
}

/* ============================================================
   UB tab — claim line items
   ============================================================ */
export interface UBDetail {
  origAllowed: number;
  adjustmentReason: string;
  modifiers: string;
  remit: string;
  rationale: string;
}

export interface UBLine {
  id: string;
  rev: string; // UB revenue code
  desc: string;
  proc: string; // procedure / HCPCS code
  service: string;
  qty: number;
  rate: number; // payment rate
  billed: number;
  adjBilled: number | null;
  adjAllowed: number | null;
  denial: string | null;
  expanded: boolean;
  detail: UBDetail;
}

export function buildUBLines(): UBLine[] {
  const raw: Array<Omit<UBLine, 'id' | 'expanded'>> = [
    {
      rev: '0250', desc: 'Pharmacy — General', proc: 'J1885', service: 'Ketorolac 30mg',
      qty: 4, rate: 0.85, billed: 480.0, adjBilled: 360.0, adjAllowed: 306.0, denial: 'OF',
      detail: { origAllowed: 408.0, adjustmentReason: 'Unit limit exceeded (plan caps 3/day)', modifiers: '59', remit: 'CO-151', rationale: 'Billed 4 units; plan allows 3 per date of service.' },
    },
    {
      rev: '0300', desc: 'Laboratory — Chemistry', proc: '80053', service: 'Comprehensive metabolic panel',
      qty: 1, rate: 1.0, billed: 142.5, adjBilled: null, adjAllowed: null, denial: null,
      detail: { origAllowed: 142.5, adjustmentReason: '', modifiers: '', remit: '', rationale: '' },
    },
    {
      rev: '0450', desc: 'Emergency Room', proc: '99284', service: 'ED visit, level 4',
      qty: 1, rate: 1.0, billed: 2425.0, adjBilled: 1940.0, adjAllowed: 1746.0, denial: 'OR',
      detail: { origAllowed: 2182.5, adjustmentReason: 'Level reduced 99284 → 99283 (acuity)', modifiers: '25', remit: 'CO-45', rationale: 'Documentation supports a level-3 visit; downcoded per MDM.' },
    },
    {
      rev: '0636', desc: 'Drugs requiring detail coding', proc: 'J2270', service: 'Morphine sulfate',
      qty: 2, rate: 0.9, billed: 96.0, adjBilled: null, adjAllowed: null, denial: null,
      detail: { origAllowed: 96.0, adjustmentReason: '', modifiers: '', remit: '', rationale: '' },
    },
    {
      rev: '0270', desc: 'Medical/Surgical Supplies', proc: 'A4550', service: 'Surgical tray',
      qty: 1, rate: 1.0, billed: 318.0, adjBilled: 0.0, adjAllowed: 0.0, denial: 'BUN',
      detail: { origAllowed: 318.0, adjustmentReason: 'Incidental — bundled into primary procedure', modifiers: '', remit: 'CO-97', rationale: 'Supply is not separately reimbursable when billed with the surgical service.' },
    },
    {
      rev: '0710', desc: 'Recovery Room', proc: '99024', service: 'Post-op recovery',
      qty: 1, rate: 1.0, billed: 640.0, adjBilled: null, adjAllowed: null, denial: null,
      detail: { origAllowed: 640.0, adjustmentReason: '', modifiers: '', remit: '', rationale: '' },
    },
    {
      rev: '0260', desc: 'IV Therapy', proc: '96365', service: 'IV infusion, initial hour',
      qty: 1, rate: 1.0, billed: 410.0, adjBilled: 410.0, adjAllowed: 369.0, denial: 'MN',
      detail: { origAllowed: 410.0, adjustmentReason: 'Allowed reduced to contracted rate', modifiers: '', remit: 'CO-45', rationale: 'Charge exceeds the contracted allowed amount for this service.' },
    },
    {
      rev: '0320', desc: 'Radiology — Diagnostic', proc: '71046', service: 'Chest X-ray, 2 views',
      qty: 1, rate: 1.0, billed: 215.0, adjBilled: null, adjAllowed: null, denial: null,
      detail: { origAllowed: 215.0, adjustmentReason: '', modifiers: '', remit: '', rationale: '' },
    },
  ];
  return raw.map((r, i) => ({ id: 'ub' + i, expanded: i === 2, ...r }));
}

/* ============================================================
   Stage panel — blockers
   ============================================================ */
export type BlockerStatus = 'active' | 'resolved';

export const BLOCKER_TOTAL_STEPS = 5;

export interface Blocker {
  id: string;
  title: string; // e.g. "Document Needed"
  stage: string; // e.g. "PIA Audit"
  days: number; // how long it's been open
  description: string;
  statusLabel: string; // pill label while active, e.g. "Documentation Requested"
  step: number; // filled progress segments (0..totalSteps)
  totalSteps: number;
  reminders: number; // reminders sent — drives the advance button label
  status: BlockerStatus;
  expanded: boolean;
}

export function buildBlockers(): Blocker[] {
  return [
    {
      id: 'b1',
      title: 'Document Needed',
      stage: 'PIA Audit',
      days: 2,
      description:
        'Missing UB-04 form — itemized bill and supporting documentation are still outstanding from the provider. Needed to validate the level-of-care findings before the claim can advance.',
      statusLabel: 'Documentation Requested',
      step: 2,
      totalSteps: BLOCKER_TOTAL_STEPS,
      reminders: 1,
      status: 'active',
      expanded: true,
    },
    {
      id: 'b2',
      title: 'Awaiting Client Confirmation',
      stage: 'PIA Audit',
      days: 1,
      description:
        'Client needs to confirm the contracted allowed rate for IV therapy before the adjustment is finalized.',
      statusLabel: 'Reminder Sent',
      step: 1,
      totalSteps: BLOCKER_TOTAL_STEPS,
      reminders: 1,
      status: 'active',
      expanded: false,
    },
    {
      id: 'b3',
      title: 'Coding Clarification',
      stage: 'Intake',
      days: 6,
      description: 'Confirmed the correct HCPCS for the infusion line; finding re-coded and validated.',
      statusLabel: 'Documentation Requested',
      step: BLOCKER_TOTAL_STEPS,
      totalSteps: BLOCKER_TOTAL_STEPS,
      reminders: 2,
      status: 'resolved',
      expanded: false,
    },
  ];
}

export const BLOCKER_TYPES = [
  'Document Needed',
  'Awaiting Client Confirmation',
  'Coding Clarification',
  'Provider Non-response',
  'Eligibility / Coverage Question',
  'Pricing Dispute',
];
