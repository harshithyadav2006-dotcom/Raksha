// ─── Shared Crisis Report Store ──────────────────────────────────────────────
// Uses localStorage + a custom event so live updates propagate across components.

const STORAGE_KEY = 'raksha_crisis_reports';

export type ReportSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type ReportStatus   = 'Pending' | 'Active' | 'Resolved' | 'Dismissed';

export interface CrisisReport {
  id: string;
  type: string;
  description: string;
  location: string;
  coords: [number, number] | null;
  severity: ReportSeverity;
  status: ReportStatus;
  anonymous: boolean;
  reporterName?: string;
  media: string[];          // base64 or file names
  reportedAt: string;       // ISO string
  updatedAt: string;
  assignedUnit: string;
  adminNotes: string;
  timeline: { time: string; action: string }[];
  caseRef: string;
}

const emit = () => window.dispatchEvent(new Event('raksha_reports_updated'));

export const reportStore = {
  getAll(): CrisisReport[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  add(report: Omit<CrisisReport, 'id' | 'reportedAt' | 'updatedAt' | 'status' | 'assignedUnit' | 'adminNotes' | 'timeline' | 'caseRef'>): CrisisReport {
    const all = reportStore.getAll();
    const caseRef = `RPT-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const full: CrisisReport = {
      ...report,
      id: caseRef,
      caseRef,
      status: 'Pending',
      assignedUnit: 'Unassigned',
      adminNotes: '',
      reportedAt: now,
      updatedAt: now,
      timeline: [
        { time: 'T+0m', action: 'Report submitted via public crisis portal' },
        { time: 'T+0m', action: `AI pre-classification: ${report.severity} severity — ${report.type}` },
      ],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([full, ...all]));
    emit();
    return full;
  },

  update(id: string, patch: Partial<CrisisReport>): void {
    const all = reportStore.getAll().map(r =>
      r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    emit();
  },

  remove(id: string): void {
    const all = reportStore.getAll().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    emit();
  },

  subscribe(cb: () => void) {
    window.addEventListener('raksha_reports_updated', cb);
    return () => window.removeEventListener('raksha_reports_updated', cb);
  },
};
