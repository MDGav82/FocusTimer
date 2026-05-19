import type { TypePeriode } from './TypePeriode';

export interface Period {
  id: number;
  time: number;
  index: number;
  typePeriode: TypePeriode;
}
