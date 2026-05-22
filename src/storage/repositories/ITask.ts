import type {Task} from "@/model/Task.ts";

export interface ITask {
    /**
     * Create a task
     * @param task the task to create
     */
    createTask(task: Task): Promise<number>

    /**
     * Get all tasks for a given user
     * @param user_id the user id
     * @returns a list of tasks
     */
    getAllTasks(user_id: number): Promise<Task[]>

    /**
     * Update the task's title'
     * @param task the task to update
     */
    updateTaskTitle(task: Task): Promise<void>

    /**
     * Update the task's description
     * @param task the task to update
     */
    updateTaskDescription(task: Task): Promise<void>

    /**
     * Set the task status to progress and the set the start date
     * @param task the task to start
     */
    startTask(task: Task): Promise<void>

    /**
     * Update the task's time spent
     * @param task the task to update
     */
    progressTask(task: Task): Promise<void>

    /**
     * Set the task status to finished and the set the end date
     * @param task the task to end
     */
    endTask(task: Task): Promise<void>

    /**
     * Delete a task
     * @param task the task to delete
     */
    deleteTask(task: Task): Promise<void>
}
