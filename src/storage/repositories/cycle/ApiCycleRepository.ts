import type {Cycle} from "@/model/Cycle.ts";
import type {ICycleRepository} from "@/storage/repositories/cycle/ICycleRepository.ts";
import {apiFetch, parseEntity, parseEntityList} from "@/storage/apiFetch.ts";
import {CycleSchema} from "@/model/schemas.ts";
import type {IApiRepository} from "@/storage/repositories/IApiRepository.ts";

export class ApiCycleRepository implements ICycleRepository, IApiRepository<Cycle> {
    async create(cycle: Cycle): Promise<void> {
        await this.createCycleForUser(cycle.user_id, cycle);
    }

    /**
     * Get a cycle by its id
     * @param id The id of the cycle to retrieve
     */
    async getById(id: string): Promise<Cycle | undefined> {
        const data = await apiFetch(`/api/cycles/${id}`, {
            method: 'GET',
        });
        return parseEntity(CycleSchema, data, id);
    }

    /**
     * Update a cycle by its id
     * @param id The id of the cycle to update
     * @param entity The updated cycle data
     */
    async update(id: string, entity: Partial<Cycle>): Promise<Cycle> {
        const data = await apiFetch(`/api/cycles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(entity),
            headers: { 'Content-Type': 'application/json' },
        });
        return parseEntity(CycleSchema, data, id);
    }

    /**
     * Delete a cycle by its id
     * @param id The id of the cycle to delete
     */
    async delete(id: string): Promise<void> {
        await apiFetch(`/api/cycles/${id}`, {
            method: 'DELETE',
        });
    }

    async createCycleForUser(userId: string, cycle: Cycle): Promise<Cycle> {
        const data = await apiFetch(`/api/users/${userId}/cycles`, {
            method: 'POST',
            body: JSON.stringify(cycle),
        });
        return parseEntity(CycleSchema, data);
    }

    async getCyclesForUser(userId: string): Promise<Cycle[]> {
        const data = await apiFetch(`/api/users/${userId}/cycles`, {
            method: 'GET',
        });
        return parseEntityList(CycleSchema, data);
    }
}
