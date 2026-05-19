import type { Parameters } from './Parameters';
import type { Task } from './Task';
import type { Cycle } from './Cycle';
import type { History } from './History';

export type User = {
  id: number;
  email: string;
  password?: string;

  // Relation 1 -- 1
  parameters: Parameters;

  // Relations 1 -- 0..*
  task: Task[];
  cycle: Cycle[];
  history: History[];
}