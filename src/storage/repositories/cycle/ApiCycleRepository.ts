import type {Cycle} from "@/model/Cycle.ts";
import type {ICycleRepository} from "@/storage/repositories/cycle/ICycleRepository.ts";

export class ApiCycleRepository implements ICycleRepository {
    /**
     * Get a cycle by its id
     * @param id The id of the cycle to retrieve
     */
    async getById(id: string): Promise<Cycle | undefined> {
        return fetch(`/api/cycles/${id}`, {
            method: 'GET',
        }).then(res => res.json());
    }

    /**
     * Update a cycle by its id
     * @param id The id of the cycle to update
     * @param entity The updated cycle data
     */
    async update(id: string, entity: Partial<Cycle>): Promise<Cycle> {
        return fetch(`/api/cycles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(entity),
            headers: { 'Content-Type': 'application/json' },
        }).then(res => res.json());
    }

    /**
     * Delete a cycle by its id
     * @param id The id of the cycle to delete
     */
    async delete(id: string): Promise<void> {
        return fetch(`/api/cycles/${id}`, {
            method: 'DELETE',
        }).then(res => res.json());
    }

    async createCycleForUser(userId: string, cycle: Cycle): Promise<Cycle> {
        return fetch(`api/user/${userId}/cycles`, {
            method: 'POST',
            body: JSON.stringify(cycle),
        }).then(res => res.json());
    }

    async getCyclesForUser(userId: string): Promise<Cycle[]> {
        return fetch(`/api/user/${userId}/cycles`, {
            method: 'GET',
        }).then(res => res.json());
    }
}
