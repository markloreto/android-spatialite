/// <reference path="../../typings/browser.d.ts" />

export interface ISpatialiteDatabaseDictionary {
    [name: string]: SpatialiteDatabase;
}

var databases: ISpatialiteDatabaseDictionary = {};

export interface ISpatialiteDatabaseStatic {
    new (): SpatialiteDatabase;
    openDatabase(
        options: ISpatialiteDatabaseOptions,
        successCallback?: (data: SpatialiteDatabase) => void,
        errorCallback?:  (data: Error) => void
    ): SpatialiteDatabase;

    deleteDatabase(
        name: string,
        successCallback: (data: string) => void,
        errorCallback: (data: Error) => void
    ): void;
}

export interface Window {
    spatialitePlugin: ISpatialiteDatabaseStatic;
}

export interface IRow {
    /* tslint:disable:no-any */
    [name: string]: any;
    /* tslint:enable:no-any */
}

export interface IRows {
    length: number;
    item(i: number): IRow;
}

export interface IResultSet {
    rowsAffected: number;
    insertId: number;
    rows: IRows;
}

export interface ICordovaResponse {
    rowsAffected: number;
    insertId: number;
    rows: IRow[];
}

export interface ISpatialiteDatabaseOptions {
    name: string;

    path?: string;
}

export class SpatialiteRows implements IRows {
    public length: number;
    private rows: IRow[];

    constructor(data: IRow[]) {
        this.length = data.length;
        this.rows = data;
    }
    public item(i: number): IRow {
        return this.rows[i];
    }
}

export class SpatialiteResultSet implements IResultSet {
    public rowsAffected: number;
    public insertId: number;
    public rows: SpatialiteRows;

    constructor(data: ICordovaResponse) {
        this.rowsAffected = data.rowsAffected;
        this.insertId = data.insertId;
        this.rows = new SpatialiteRows(data.rows);
    }
}

export class SpatialiteTransaction {
    public name: string;
    public path: string;

    constructor(name: string, path?: string) {
        this.name = name;
    }

    public executeSql(sql: string,
                      binding: string[],
                      successCallback: (transaction: SpatialiteTransaction, data: SpatialiteResultSet) => void,
                      errorCallback: (transaction: SpatialiteTransaction, data: Error) => void): void {

        /* tslint:disable:no-any */
        cordova.exec(
            (results: any): void => {
                successCallback(this, new SpatialiteResultSet(results));
            },
            (error: string): any => {
                console.error('fail: ' + error);
                errorCallback(this, new Error(error));
            },
            CORDOVA_MODULE_NAME,
            'executeSql',
            [this.name, sql]
        );

        /* tslint:enable:no-any */
    }
}

/* tslint:disable:no-empty no-any */
const emptyFn: (...args: any[]) => void = function (...args: any[]): void {};
/* tslint:enable:no-empty no-any */
export const CORDOVA_MODULE_NAME: string = 'SpatialitePlugin';


export class SpatialiteDatabase {
    public name: string;
    public path: string;
    public connected: boolean = false;

    public static openDatabase(
        options: ISpatialiteDatabaseOptions,
        successCallback: (data: SpatialiteDatabase) => void = emptyFn,
        errorCallback:  (data: Error) => void = emptyFn): SpatialiteDatabase {
        
        var db: SpatialiteDatabase,
            name: string = options.name;


        if (databases[name]) {
            if (typeof successCallback === 'function') {
                successCallback(databases[name]);
            }
            return databases[name];
        }

        db = new SpatialiteDatabase(options);

        db.open(successCallback, errorCallback);
        databases[name] = db;
        return db;

    }

    public static deleteDatabase(
        opts: ISpatialiteDatabaseOptions,
        successCallback: (data: string) => void,
        errorCallback: (data: Error) => void): void {
        cordova.exec(
            (): void => {
                successCallback('OK');
            },
            (data: string): void => {
                errorCallback(new Error(data));
            },
            CORDOVA_MODULE_NAME,
            'deleteDatabase',
            [opts.name, opts.path]
        );
    }


    constructor(opts: ISpatialiteDatabaseOptions) {
        this.name = opts.name;
        this.path = opts.path;
    }

    public transaction(callback: (data: SpatialiteTransaction) => void): void {
        callback(new SpatialiteTransaction(this.name));
    }
    public executeSql(sql: string,
                      binding: string[],
                      successCallback: (data: SpatialiteResultSet) => void,
                      errorCallback: (data: Error) => void): void {
        this.transaction((tx: SpatialiteTransaction): void => {
            /* tslint:disable:no-shadowed-variable align */
            tx.executeSql(sql, binding, (tx: SpatialiteTransaction, result: SpatialiteResultSet): void => {
                successCallback(result);
            }, (tx: SpatialiteTransaction, error: Error): void => {
                errorCallback(error);
            });

            /* tslint:enable:no-shadowed-variable align */
        });
    }
    public open(successCallback: (data: SpatialiteDatabase) => void, errorCallback: (data: Error) => void): void {
        cordova.exec(
            (): void => {
                this.connected = true;
                successCallback(this);
            },
            (data: string): void => {
                this.connected = false;
                errorCallback(new Error(data));
            },
            CORDOVA_MODULE_NAME,
            'openDatabase',
            [this.name, this.path]
        );
    }
}

window.spatialitePlugin = SpatialiteDatabase;
