import {GenericIndexedDbRepository} from "@/storage/repositories/GenericIndexDbRepository.ts";
import type {User} from "@/model/User.ts";
import type {IUserRepository} from "@/storage/repositories/user/IUserRepository.ts";
import {idbAddGet, idbGet, idbUpdate} from "@/storage/indexDb.ts";
import type {Parameters} from "@/model/Parameters.ts";

export class IdbUserRepository extends GenericIndexedDbRepository<User> implements IUserRepository {
    async updateParameters(id: string, parameters: Partial<Parameters>): Promise<User> {
        return idbUpdate(this.db, 'user', id, user => {
            user.parameters = {...user.parameters, ...parameters}
        })
    }

    async getLastSessionUser(): Promise<User | undefined> {
        return await idbGet<User>(this.db, this.storeName, 'lastSessionUser');
    }

    createLocalUser(user: User): Promise<User> {
        return idbAddGet(this.db, this.storeName, user, 'lastSessionUser')
    }
}