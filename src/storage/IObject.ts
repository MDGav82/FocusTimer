export interface IndexDefinition {
    name: string;
    keyPath: string | string[];
    options?: IDBIndexParameters;
}

export interface StorableInstance {
    [key: string]: any;
}

export interface StorableConstructor<T extends StorableInstance> {
    new(id: number, ...args: any[]): T;
    readonly storeName: string;
    readonly keyPath: string;
    readonly indexes?: IndexDefinition[];
}
