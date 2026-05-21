import type {ITask} from "@/storage/repositories/ITask.ts";
import type {ICycle} from "@/storage/repositories/ICycle.ts";
import type {IPeriod} from "@/storage/repositories/IPeriod.ts";

export interface IStore extends
    ITask,
    ICycle,
    IPeriod
{
    mock(): void;
}
