import {GenericIndexedDbRepository} from "@/storage/repositories/GenericIndexDbRepository.ts";
import {type User, type UserMeta, UserMetaStoreOptions} from "@/model/User.ts";
import type {IUserRepository} from "@/storage/repositories/user/IUserRepository.ts";
import {idbAdd, idbAddGet, idbGet, idbUpdate} from "@/storage/indexDb.ts";
import type {Parameters} from "@/model/Parameters.ts";

export class IdbUserRepository extends GenericIndexedDbRepository<User> implements IUserRepository {
    updateParameters(id: string, parameters: Partial<Parameters>): Promise<User> {
        return idbUpdate(this.db, 'user', id, user => {
            user.parameters = {...user.parameters, ...parameters}
        })
    }

    getLastSessionMeta(): Promise<UserMeta | undefined> {
        return idbGet<UserMeta>(this.db, UserMetaStoreOptions.name, 'lastSessionUser');
    }

    createLocalUser(user: User): Promise<User> {
        return idbAddGet<User>(this.db, this.storeName, user)
    }

    async updateSessionMeta(data: Partial<UserMeta>): Promise<UserMeta> {
        const meta = await this.getLastSessionMeta();
        if (meta === undefined) await idbAdd<UserMeta>(this.db, UserMetaStoreOptions.name, {
            id: 'lastSessionUser',
            lastUserId: data.lastUserId ?? "",
            selectedCycleId: data.selectedCycleId ?? ""
        })
        return idbUpdate<UserMeta>(this.db, UserMetaStoreOptions.name, 'lastSessionUser', item => ({...item, ...data}))
    }
}