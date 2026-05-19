import type { TypePeriode } from './TypePeriode';

export interface History {
  id: number;
  startSate: Date;
  timespent: number;
  typePeriode: TypePeriode;
}
