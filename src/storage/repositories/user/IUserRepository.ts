import type {IRepository} from "@/storage/repositories/IRepository.ts";
import type {User} from "@/model/User.ts";
import type {Parameters} from "@/model/Parameters.ts";

export interface IUserRepository extends IRepository<User> {
    updateParameters(id: string, parameters: Partial<Parameters>): Promise<User>;
}