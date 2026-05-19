import type { Period } from './Period';

export interface Cycle {
  id: number;
  name: string;
  periods: Period[];
}
