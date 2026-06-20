import type {BaseEntity} from "@/model/BaseEntity.ts";

export interface Parameters extends BaseEntity {
    // static readonly storeName: string = 'parameters';
    // static readonly keyPath: string = 'id';
    // static readonly indexes?: IndexDefinition[] = [
    //     {name: "by_id", keyPath: "id", options: {unique: true}}
    // ];

    autoStartWork: boolean;
    autoStartRest: boolean;
    autoRestartCycle: boolean;
    notificationsOn: boolean;
}
