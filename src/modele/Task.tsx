import type { Status } from './Status';

export type Task = {
  id: number;
  title: string;
  description: string;
  estimatedTime: number;
  progress: number;
  creationDate: Date; 
  startDate?: Date;
  timeSpent: number;
  endDate?: Date;
  status: Status;
}