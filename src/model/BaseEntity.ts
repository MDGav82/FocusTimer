export interface StorableEntity {
    id: string,
}

export interface BaseEntity extends StorableEntity {
    updatedAt: number;
    _syncStatus: 'synced' | 'pending' | 'conflict';
}

export type PureEntity<T extends BaseEntity> = Omit<T, 'id' | 'updatedAt' | '_syncStatus'>;