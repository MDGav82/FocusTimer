import type {User} from "@/model/User.ts";
import type {IUserRepository} from "@/storage/repositories/user/IUserRepository.ts";
import type {Parameters} from "@/model/Parameters.ts";
import {apiFetch, parseEntity} from "@/storage/apiFetch.ts";
import {UserSchema} from "@/model/schemas.ts";

export class ApiUserRepository implements IUserRepository {
    /**
     * Get a user by its id
     * @param id The id of the user to retrieve
     */
    async getById(id: string): Promise<User | undefined> {
        const data = await apiFetch(`/api/users/${id}`, {
            method: 'GET',
        });
        return parseEntity(UserSchema, data, id);
    }

    /**
     * Update a user by its id
     * @param id The id of the user to update
     * @param entity The updated user data
     */
    async update(id: string, entity: Partial<User>): Promise<User> {
        const data = await apiFetch(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(entity),
            headers: { 'Content-Type': 'application/json' },
        });
        return parseEntity(UserSchema, data, id);
    }

    /**
     * Delete a user by its id
     * @param id The id of the user to delete
     */
    async delete(id: string): Promise<void> {
        await apiFetch(`/api/users/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Update parameters for a user
     * @param id The id of the user to update parameters for
     * @param parameters The updated parameters
     */
    async updateParameters(id: string, parameters: Partial<Parameters>): Promise<User> {
        const data = await apiFetch(`/api/users/${id}/parameters`, {
            method: 'PUT',
            body: JSON.stringify(parameters),
            headers: { 'Content-Type': 'application/json' },
        });
        return parseEntity(UserSchema, data, id);
    }
}
