export interface BaseEntity {
    id: string;
    updatedAt: number;
    _syncStatus: 'synced' | 'pending' | 'conflict';
}

export type PureEntity<T extends BaseEntity> = Omit<T, 'id' | 'updatedAt' | '_syncStatus'>;