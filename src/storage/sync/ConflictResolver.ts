import type {BaseEntity} from "@/model/BaseEntity.ts";

export class ConflictResolver {
  resolve<T extends BaseEntity>(local: T, server: T): T {
    // Strategy: Last Write Wins
    return local.updatedAt > server.updatedAt ? local : server;
  }
}
