import type { TypePeriode } from './TypePeriode';

export type History = {
  id: number;
  startSate: Date;
  timespent: number;
  typePeriode: TypePeriode;
}
