import {ISpatialiteDatabaseStatic, SpatialiteDatabase} from '../../src/ts/websql-api';

const TEST_DATA: string = 'It works';

const TEST_DB: string = 'native-test';
const TEST_TABLE: string = 'native-test';
const TEST_SPARTIAL_TABLE: string = 'native-spatial-test';
const TEST_POINT: string = 'POINT(123.45 543.21)';
const TEST_POLYGON: string = 'POLYGON((100 500, 100 600, 200 600, 200 500, 100 500))';

interface IErrorHelper {
    (err: SQLError): void;
}

function parseSQLError(done: MochaDone): IErrorHelper {
    return (err: SQLError): void => {
        done(new Error('Error with database. Code: ' + err.code + ', message: ' + err.message));
    };
}



declare var sqlitePlugin: ISpatialiteDatabaseStatic;

describe('Cordova native SQLite API', (): void => {
    if (!window.cordova) {
        it.skip('Your device is not supporting this database');
        return;
    }

    var handle: SpatialiteDatabase;

    function testFactory(name: string, sql: string, cb: (results: SQLResultSet) => string): void {
        it(name, (done: MochaDone): void => {
            handle = handle || sqlitePlugin.openDatabase(TEST_DB, '0.0.1', 'Test data', 1024 * 1024);
            handle.executeSql(sql, [], (result: SQLResultSet): void => {
                var message: string = cb(result);

                if (message) {
                    window.console.error('Error with', name, result);
                    return done(new Error(message));
                }
                return done();
            }, parseSQLError(done));
        });
    }
    
    it('should have ')
    

    it('should connect to database', (done: MochaDone): void => {
        //var tmpHandle: Database = sqlitePlugin.openDatabase( TEST_DB, '0.0.1', 'Test data', 1024 * 1024);
        var tmpHandle: Database = sqlitePlugin.openDatabase(TEST_DB, (db: Database): void => { // is not a status string!
            window.console.log('should connect to database', db);
            if (db.dbname !== TEST_DB) {
                return done(new Error('Wrong database returned'));
            }
            handle = db;
            return done();
        }, done);
        if (!tmpHandle) {
            throw new Error('Wrong DB handle returned');
        }
    });

    testFactory(
        'should create a table within test database',
        'CREATE TABLE IF NOT EXISTS "' + TEST_TABLE + '" (a INTEGER, b VARCHAR(255));',
        (result: SQLResultSet): string => {
            return '';
        });
    testFactory(
        'should write data to table',
        'INSERT INTO "' + TEST_TABLE + '" (a, b) VALUES (123, "' + TEST_DATA + '");',
        (result: SQLResultSet): string => {
            if (result.rows.length !== 0 || result.rowsAffected !== 1) {
                return 'Wrong result-set returned';
            }
            return '';
        });
    testFactory(
        'should read created data from table',
        'SELECT * FROM "' + TEST_TABLE + '" WHERE a=123;',
        (result: SQLResultSet): string => {
            if (result.rows.length !== 1 || result.rows.item(0).a !== 123 ||  result.rows.item(0).b !== TEST_DATA) {
                return 'Wrong result-set returned';
            }
            return '';
        });
    testFactory(
        'should delete created data from table',
        'DELETE FROM "' + TEST_TABLE + '" WHERE a=123;',
        (result: SQLResultSet): string => {
            if (result.rows.length !== 0 || result.rowsAffected !== 1) {
                return 'Wrong result-set returned';
            }
            return '';
        });
    testFactory(
        'should not read created data anymore from table',
        'SELECT * FROM "' + TEST_TABLE + '" WHERE a=123;',
        (result: SQLResultSet): string => {
            if (result.rows.length !== 0) {
                return 'Wrong result-set returned';
            }
            return '';
        });



    it('should drop database again', (done: MochaDone): void => {
        sqlitePlugin.deleteDatabase(TEST_DB, (status: string): void => {
            if (status !== 'OK') {
                return done(new Error('Wrong status after deleting: ' + status));
            }
            return done();
        }, (message: string): void => {
            return done(new Error('Error while deleting Database: ' + message));
        });
    });
    describe('Spatialite', (): void => {


        describe('Selects', (): void => {
            testFactory(
                'should get geos version',
                'SELECT geos_version() as geosv;',
                (result: SQLResultSet): string => {
                    if (result.rows.length !== 1) {
                        return 'No geos installed';
                    }
                    console.log('Geos version:' + result.rows.item(0).geosv);
                    return '';
                });
            testFactory(
                'should get proj4 version',
                'SELECT proj4_version() as projv;',
                (result: SQLResultSet): string => {
                    if (result.rows.length !== 1) {
                        return 'No PROJ4 installed';
                    }
                    console.log('PROJ4 version:' + result.rows.item(0).projv);
                    return '';
                });

            testFactory(
                'should get sqlite version',
                'SELECT sqlite_version() as sqlitev;',
                (result: SQLResultSet): string => {
                    if (result.rows.length !== 1) {
                        return 'No SQLite installed';
                    }
                    console.log('SQLite version:' + result.rows.item(0).sqlitev);
                    return '';
                });

            testFactory(
                'should get spartialite version',
                'SELECT spatialite_version() as spatialitev;',
                (result: SQLResultSet): string => {
                    if (result.rows.length !== 1) {
                        return 'No spartialite installed';
                    }
                    console.log('spartialite version:' + result.rows.item(0).spatialitev);
                    return '';
                });

            testFactory(
                'should parse point from WKT',
                'SELECT AsText(GeomFromText("' + TEST_POINT + '")) as c;',
                (result: SQLResultSet): string => {
                    if (result.rows.length !== 1) {
                        return 'Wrong response';
                    }
                    if (result.rows.item(0).c !== TEST_POINT) {
                        return 'This is not the expected WKT';
                    }
                    return '';
                });
            testFactory(
                'should parse point from WKT to geoJSON',
                'SELECT AsGeoJSON(GeomFromText("' + TEST_POINT + '")) AS geojson;',
                (result: SQLResultSet): string => {
                    if (result.rows.length !== 1) {
                        return 'Wrong response';
                    }
                    console.log('GEOJSON: ', result);
                    try {
                        var json: any = JSON.parse(result.rows.item(0).geojson);
                        console.log(json);
                    } catch (e) {
                        return 'Error while parsing JSON: ' + e.message;
                    }
                    return '';
                });
            testFactory(
                'should parse polygon from WKT',
                'SELECT AsText(GeomFromText("' + TEST_POLYGON + '")) as c;',
                (result: SQLResultSet): string => {
                    if (result.rows.length !== 1) {
                        return 'Wrong response';
                    }
                    if (result.rows.item(0).c !== TEST_POLYGON) {
                        return 'This is not the expected WKT';
                    }
                    return '';
                });

        });


        testFactory(
            'should create a spatial table within test database',
            'CREATE TABLE IF NOT EXISTS "' + TEST_SPARTIAL_TABLE + '" (a INTEGER, b VARCHAR(255), c BLOB);',
            (result: SQLResultSet): string => {
                return '';
            });
        testFactory(
            'should write data to table',
            'INSERT INTO "' + TEST_SPARTIAL_TABLE + '" (a, b) VALUES (123, "' + TEST_DATA + '");',
            (result: SQLResultSet): string => {
                if (result.rows.length !== 0 || result.rowsAffected !== 1) {
                    return 'Wrong result-set returned';
                }
                return '';
            });
        testFactory(
            'should read created data from table',
            'SELECT * FROM "' + TEST_SPARTIAL_TABLE + '" WHERE a=123;',
            (result: SQLResultSet): string => {
                if (result.rows.length !== 1 || result.rows.item(0).a !== 123 ||  result.rows.item(0).b !== TEST_DATA) {
                    return 'Wrong result-set returned';
                }
                return '';
            });
        testFactory(
            'should write a spatial point to table',
            'INSERT INTO "' + TEST_SPARTIAL_TABLE + '" (a, b, c) VALUES (1234, "' + TEST_DATA + '", GeomFromText("' + TEST_POINT + '"));',
            (result: SQLResultSet): string => {
                if (result.rows.length !== 0 || result.rowsAffected !== 1) {
                    return 'Wrong result-set returned';
                }
                return '';
            });
        testFactory(
            'should write a spatial polygon to table',
            'INSERT INTO "' + TEST_SPARTIAL_TABLE + '" (a, b, c) VALUES (1234, "' + TEST_DATA + '", GeomFromText("' + TEST_POLYGON + '"));',
            (result: SQLResultSet): string => {
                if (result.rowsAffected !== 1) {
                    return 'Wrong result-set returned';
                }
                return '';
            });

        testFactory(
            'should get spatial data from table',
            'SELECT a, b, AsText(c) FROM "' + TEST_SPARTIAL_TABLE + '" WHERE a=1234;',
            (result: SQLResultSet): string => {
                if (result.rows.length !== 2) {
                    return 'Wrong result-set returned';
                }
                return '';
            });
        testFactory(
            'should write another spatial point to table',
            'INSERT INTO "' + TEST_SPARTIAL_TABLE + '" (a, b, c) VALUES (1234, "' + TEST_DATA + '", GeomFromText("POINT(10000 10000)"));',
            (result: SQLResultSet): string => {
                if (result.rowsAffected !== 1) {
                    return 'Wrong result-set returned';
                }
                return '';
            });
        testFactory(
            'should read created geometries with INTERSECTS',
            'SELECT a, b, AsText(c) FROM "' + TEST_SPARTIAL_TABLE + '" WHERE INTERSECTS(GeomFromText("' + TEST_POLYGON + '"), c) ;',
            (result: SQLResultSet): string => {
                if (result.rows.length !== 3) {
                    return 'Wrong result-set returned';
                }
                return '';
            });
        testFactory(
            'should drop all data',
            'DELETE FROM "' + TEST_SPARTIAL_TABLE + '";',
            (result: SQLResultSet): string => {
                if (result.rowsAffected !== 4) {
                    return 'Wrong result-set returned';
                }
                return '';
            });
        testFactory(
            'should drop the whole table',
            'DROP TABLE "' + TEST_SPARTIAL_TABLE + '";',
            (result: SQLResultSet): string => {
                if (result.rowsAffected !== 4) {
                    return 'Wrong result-set returned';
                }
                return '';
            });


        it('should drop database again', (done: MochaDone): void => {
            sqlitePlugin.deleteDatabase(TEST_DB, (status: string): void => {
                if (status !== 'OK') {
                    return done(new Error('Wrong status after deleting: ' + status));
                }
                return done();
            }, (message: string): void => {
                return done(new Error('Error while deleting Database: ' + message));
            });
        });
    });
});