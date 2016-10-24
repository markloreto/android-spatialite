/// <reference path="../typings/index.d.ts" />

export interface ISpatialiteDatabaseDictionary {
    [name: string]: SpatialiteDatabase;
}

/* tslint:disable:no-empty no-any */
const emptyFn: (...args: any[]) => void = function (...args: any[]): void {};
/* tslint:enable:no-empty no-any */
export const CORDOVA_MODULE_NAME: string = 'SpatialitePlugin';

const databases: ISpatialiteDatabaseDictionary = {};

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

/* tslint:disable:interface-name */
export interface Window {
    spatialitePlugin: ISpatialiteDatabaseStatic;
}
/* tslint:enable */

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

/**
 * @class
 * @property {number} length - Number of rows
 */
    //
export class SpatialiteRows implements IRows {
    public length: number;
    /**
     * Rows as array
     * @private
     * @memberOf SpatialiteRows
     * @type {IRow[]}
     */
    private rows: IRow[];

    constructor(data: IRow[]) {
        this.length = data.length;
        this.rows = data;
    }

    /**
     * Get a row by its number
     * @memberOf SpatialiteRows
     * @param {number} i - Number of the row
     * @returns {IRow}
     */
    public item(i: number): IRow {
        return this.rows[i];
    }
}

/**
 * @class
 * @property {number} rowsAffected - Number of rows that was affected by the call
 * @property {number} insertId - ID of the insert
 * @property {SpatialiteRows} rows - Rows as object
 */
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

/**
 * @class
 * @property {string} name - Name of the database
 * @property {string} path - Path to the database
 */
export class SpatialiteTransaction {

    /**
     * Success callback of a database call.
     * @callback SpatialiteTransaction~successCallback
     * @param {SpatialiteTransaction} transaction - The transaction object itself
     * @param {SpatialiteResultSet} data - The result-set as object
     */
    /**
     * Success callback of a database call.
     * @callback SpatialiteTransaction~errorCallback
     * @param {SpatialiteTransaction} transaction - The transaction object itself
     * @param {Error} error
     */
    public name: string;
    public path: string;

    constructor(name: string, path?: string) {
        this.name = name;
    }

    /**
     * Run a SQL statement on this transaction
     * @memberOf SpatialiteTransaction
     * @param {string} sql - The statement you want to run. Questions marks will be replaced with the data in bindings
     * @param {string[]} binding - Bindings for the sql statement
     * @param {SpatialiteTransaction~successCallback} successCallback
     * @param {SpatialiteTransaction~errorCallback} errorCallback
     */
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

/**
 * @class
 * @property {string} name - Name of the database
 * @property {string} path - Path to the database
 * @property {boolean} connected - Is the database already connected?
 */
export class SpatialiteDatabase {
    /**
     * Success callback of the opening database call.
     * @callback SpatialiteDatabase~successCallback
     * @param {SpatialiteDatabase} data - The result-set as object
     */
    /**
     * Error callback of the opening database call.
     * @callback SpatialiteDatabase~errorCallback
     * @param {Error} error
     */
    /**
     * Error callback of the opening database call.
     * @callback SpatialiteDatabase~transactionCallback
     * @param {SpatialiteTransaction} transaction
     */
    /**
     * Success opening callback of the simple open call.
     * @callback SpatialiteDatabase~successOpenCallback
     * @param {string} status
     */
    /**
     * Success statement callback.
     * @callback SpatialiteDatabase~successStatementCallback
     * @param {SpatialiteResultSet} resultSet
     */

    public name: string;
    public path: string;
    public connected: boolean = false;

    /**
     * Open or create a Database
     * @static
     * @memberOf SpatialiteDatabase
     * @param {ISpatialiteDatabaseOptions} options
     * @param {SpatialiteDatabase~successCallback} successCallback
     * @param {SpatialiteDatabase~errorCallback} errorCallback
     * @returns {SpatialiteDatabase}
     */
    public static openDatabase(
        options: ISpatialiteDatabaseOptions,
        successCallback: (data: SpatialiteDatabase) => void = emptyFn,
        errorCallback:  (data: Error) => void = emptyFn): SpatialiteDatabase {
        'use strict';
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

    /**
     * Delete a Database
     * @static
     * @memberOf SpatialiteDatabase
     * @param opts
     * @param successCallback
     * @param {SpatialiteDatabase~errorCallback} errorCallback
     */
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

    /**
     * Create a transaction object
     * @param {SpatialiteDatabase~transactionCallback} callback
     */
    public transaction(callback: (data: SpatialiteTransaction) => void): void {
        callback(new SpatialiteTransaction(this.name));
    }

    /**
     * Execute a SQL statement
     * @memberOf SpatialiteDatabase
     * @param {string} sql - The statement you want to run. Questions marks will be replaced with the data in bindings
     * @param {string[]} binding - Bindings for the sql statement
     * @param {SpatialiteDatabase~successStatementCallback} successCallback
     * @param {SpatialiteDatabase~errorCallback} errorCallback
     */
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

    /**
     * Open the database that was defined in this object
     * @memberOf SpatialiteDatabase
     * @param {SpatialiteDatabase~successOpenCallback} successCallback
     * @param {SpatialiteDatabase~errorCallback} errorCallback
     */
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

(<any>window).spatialitePlugin = SpatialiteDatabase;
