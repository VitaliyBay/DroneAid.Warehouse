export type DroneType = 'Analog' | 'Digital';
export type DroneStatus = 'Available' | 'InTesting' | 'NeedsRepair' | 'Unavailable';
export type IssueStatus = 'Open' | 'Resolved';

export const DRONE_TYPES: DroneType[] = ['Analog', 'Digital'];

export const DRONE_STATUSES: { value: DroneStatus; label: string; css: string }[] = [
  { value: 'Available', label: 'Available', css: 'da-status-available' },
  { value: 'InTesting', label: 'In testing', css: 'da-status-testing' },
  { value: 'NeedsRepair', label: 'Needs repair', css: 'da-status-repair' },
  { value: 'Unavailable', label: 'Unavailable', css: 'da-status-unavailable' }
];

export function statusLabel(status: DroneStatus): string {
  return DRONE_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export function statusClass(status: DroneStatus): string {
  return DRONE_STATUSES.find((item) => item.value === status)?.css ?? '';
}

export interface LoginResponse {
  userName: string;
  role: string;
}

export interface ComponentInput {
  name: string;
  detail: string | null;
  quantity: number;
}

export interface DroneSummary {
  id: string;
  code: string;
  nickname: string;
  type: DroneType;
  status: DroneStatus;
  componentCount: number;
  openIssueCount: number;
  videoCount: number;
  updatedAtUtc: string;
}

export interface DroneComponent {
  id: string;
  name: string;
  detail: string | null;
  quantity: number;
}

export interface DroneIssue {
  id: string;
  title: string;
  description: string | null;
  componentName: string | null;
  status: IssueStatus;
  reportedAtUtc: string;
  resolvedAtUtc: string | null;
}

export interface DroneVideo {
  id: string;
  url: string;
  label: string | null;
  testedOn: string | null;
  addedAtUtc: string;
}

export interface DroneDetail {
  id: string;
  code: string;
  nickname: string;
  type: DroneType;
  status: DroneStatus;
  statusChangedAtUtc: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  components: DroneComponent[];
  issues: DroneIssue[];
  videos: DroneVideo[];
}

export interface DroneStatusSummary {
  total: number;
  available: number;
  inTesting: number;
  needsRepair: number;
  unavailable: number;
}

export interface DroneFilters {
  search: string;
  status: DroneStatus | '';
  type: DroneType | '';
}

export function errorMessage(error: unknown, fallback: string): string {
  const message = (error as { error?: { message?: string } } | null)?.error?.message;
  return message ?? fallback;
}
