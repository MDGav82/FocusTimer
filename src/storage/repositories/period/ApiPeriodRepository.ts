import type {Period} from "@/model/Period.ts";
import type {IPeriodRepository} from "@/storage/repositories/period/IPeriodRepository.ts";
import {apiFetch, parseEntity, parseEntityList} from "@/storage/apiFetch.ts";
import {PeriodSchema} from "@/model/schemas.ts";
import type {IApiRepository} from "@/storage/repositories/IApiRepository.ts";

export class ApiPeriodRepository implements IPeriodRepository, IApiRepository<Period> {
    async create(period: Period): Promise<void> {
        await this.createPeriodForCycle(period.cycle_id, period);
    }

    /**
     * Get a period by its id
     * @param id The id of the period to retrieve
     */
    async getById(id: string): Promise<Period | undefined> {
        const data = await apiFetch(`/api/periods/${id}`, {
            method: 'GET',
        });
        return parseEntity(PeriodSchema, data, id);
    }

    /**
     * Update a period by its id
     * @param id The id of the period to update
     * @param entity The updated period data
     */
    async update(id: string, entity: Partial<Period>): Promise<Period> {
        const data = await apiFetch(`/api/periods/${id}`, {
            method: 'PUT',
            body: JSON.stringify(entity),
        });
        return parseEntity(PeriodSchema, data, id);
    }

    /**
     * Delete a period by its id
     * @param id The id of the period to delete
     */
    async delete(id: string): Promise<void> {
        await apiFetch(`/api/periods/${id}`, {
            method: 'DELETE',
        });
    }

    async createPeriodForCycle(cycleId: string, period: Period): Promise<Period> {
        const data = await apiFetch(`/api/cycles/${cycleId}/periods`, {
            method: 'POST',
            body: JSON.stringify(period),
        });
        return parseEntity(PeriodSchema, data);
    }

    async getPeriodsForCycle(cycleId: string): Promise<Period[]> {
        const data = await apiFetch(`/api/cycles/${cycleId}/periods`, {
            method: 'GET',
        });
        return parseEntityList(PeriodSchema, data);
    }
}
