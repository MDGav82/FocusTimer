import type {IRepository} from "@/storage/repositories/IRepository.ts";
import type {Task} from "@/model/Task.ts";
import type {PureEntity} from "@/model/BaseEntity.ts";

export interface ITaskRepository extends IRepository<Task> {
    createTaskForUser(userId: string, task: PureEntity<Task>): Promise<Task>;
    getTasksForUser(userId: string): Promise<Task[]>;
}