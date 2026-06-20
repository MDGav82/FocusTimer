import type {Period} from "@/model/Period.ts";
import type {IPeriodRepository} from "@/storage/repositories/period/IPeriodRepository.ts";

export class ApiPeriodRepository implements IPeriodRepository {
    /**
     * Get a period by its id
     * @param id The id of the period to retrieve
     */
    async getById(id: string): Promise<Period | undefined> {
        return fetch(`/api/periods/${id}`, {
            method: 'GET',
        }).then(res => res.json());
    }

    /**
     * Update a period by its id
     * @param id The id of the period to update
     * @param entity The updated period data
     */
    async update(id: string, entity: Partial<Period>): Promise<Period> {
        return fetch(`/api/periods/${id}`, {
            method: 'PUT',
            body: JSON.stringify(entity),
        }).then(res => res.json());
    }

    /**
     * Delete a period by its id
     * @param id The id of the period to delete
     */
    async delete(id: string): Promise<void> {
        return fetch(`/api/periods/${id}`, {
            method: 'DELETE',
        }).then(res => res.json());
    }

    async createPeriodForCycle(cycleId: string, period: Period): Promise<Period> {
        return fetch(`/api/cycles/${cycleId}/periods`, {
            method: 'POST',
            body: JSON.stringify(period),
        }).then(res => res.json());
    }

    async getPeriodsForCycle(cycleId: string): Promise<Period[]> {
        return fetch(`/api/cycles/${cycleId}/periods`, {
            method: 'GET',
        }).then(res => res.json());
    }
}
