export const defaultParams: Parameters = {
    notificationsOn:   true,
    autoStartWork:     false,
    autoStartRest:     false,
    autoRestartCycle:  false,
}

export interface Parameters {
    // static readonly storeName: string = 'parameters';
    // static readonly keyPath: string = 'id';
    // static readonly indexes?: IndexDefinition[] = [
    //     {name: "by_id", keyPath: "id", options: {unique: true}}
    // ];

    autoStartWork: boolean;
    autoStartRest: boolean;
    autoRestartCycle: boolean;
    notificationsOn: boolean;
}
