export type VisitorLead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  destination: string;
  createdAt: string;
  sourcePath: string;
  status: 'New';
};

export const VISITOR_LEADS_KEY = 'the-himalayan-hikes-visitor-leads';
export const LEAD_PROMPT_STATE_KEY = 'the-himalayan-hikes-lead-prompt';
export const BOOKED_SUPPRESSION_KEY = 'the-himalayan-hikes-booked-after-lead-prompt';

export function readVisitorLeads(value: unknown): VisitorLead[] {
  if (!Array.isArray(value)) return [];
  return value.filter(item => item && typeof item === 'object' && typeof item.id === 'string').map(item => ({
    id: String(item.id), name: String(item.name || ''), phone: String(item.phone || ''),
    email: String(item.email || ''), destination: String(item.destination || ''), createdAt: String(item.createdAt || ''),
    sourcePath: String(item.sourcePath || '/'), status: 'New' as const,
  }));
}
