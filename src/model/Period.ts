import type { IndexDefinition, StorableInstance } from "@/storage/IStorable.ts";

export enum PType {
  WORK,
  BREAK,
}
export type PeriodType = {
  id: number;
  time: number;
  type: PType;
  index: number;
};
export class Period implements StorableInstance {
  static readonly storeName: string = "period";
  static readonly keyPath: string = "id";
  static readonly indexes?: IndexDefinition[] = [
    { name: "by_id", keyPath: "id", options: { unique: true } },
  ];

  constructor(
    public id: number,
    public time: number,
    public index: number,
    public typePeriode: PType,
  ) {}
}
