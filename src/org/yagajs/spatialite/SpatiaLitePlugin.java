package org.yagajs.spatialite;

import java.io.File;
import java.util.HashMap;

import jsqlite.Database;
import jsqlite.Stmt;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

/**
 * Spatialite Cordova Plugin.
 */
public class SpatiaLitePlugin extends CordovaPlugin {
	static HashMap<String, Database> dbmap = new HashMap<String, Database>();

	private void closeDatabase(String dbName){
		Database db = this.getDatabase(dbName);

		if(db != null){
			try{
				db.close();
			}
			catch(Exception ex){
				ex.printStackTrace();
			}
			dbmap.remove(dbName);
		}
	}

	/*
	 * (non-Javadoc)
	 * @see org.apache.cordova.CordovaPlugin#execute(java.lang.String, org.json.JSONArray, org.apache.cordova.CallbackContext)
	 */
	@Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("openDatabase")) {
            String dbName = args.getString(0);
            Log.v("sqlite", "execute " + dbName);
            this.openDatabase(dbName, callbackContext);
            return true;
        }
        else if(action.equals("executeSql")) {
        	String dbName = args.getString(0);
            String sql = args.getString(1);
            this.executeSql(dbName, sql, callbackContext);
            return true;
        }
        else if (action.equals("info")) {
            String dbName = args.getString(0);
            this.info(dbName, callbackContext);
            return true;
        }
        return false;
    }

	/**
	 * Get database from map cache.
	 * @param dbname database name.
	 * @return Spatialite database.
	 */
	private Database getDatabase(String dbname){
		return dbmap.get(dbname);
	}

	/**
	 * Execute raw SQL 
	 * @param dbName
	 * @param sql
	 * @param callbackContext
	 */
	private void executeSql(String dbName, String sql, CallbackContext callbackContext){
        Log.d("sqlite", dbName + " : " + sql);
		Database db = this.getDatabase(dbName);
		try {
            Stmt stmt = db.prepare(sql);
            JSONArray results = new JSONArray();
            while( stmt.step() ) {
            	JSONObject row = new JSONObject();
            	for(int i = 0; i < stmt.column_count(); i++){
            		row.put(String.valueOf(i), stmt.column_string(i));
            	}
            	results.put(row);
            }
            callbackContext.success(results);          
            stmt.close();
        }
		catch (Exception e) {
			e.printStackTrace();
			callbackContext.error(e.getMessage());
        }
	}

	/**
	 * Get database details.
	 * @param dbname
	 * @param callbackContext
	 */
	private void info(String dbname, CallbackContext callbackContext){
        Log.v("sqlite", "Info for: " + dbname);

        StringBuilder sb = new StringBuilder();
        sb.append("Check versions...\n");

        Database db = this.getDatabase(dbname);

        try{
	        Stmt stmt01 = db.prepare("SELECT spatialite_version();");
	        if (stmt01.step()) {
	            sb.append("\t").append("SPATIALITE_VERSION: " + stmt01.column_string(0));
	            sb.append("\n");
	        }

	        stmt01 = db.prepare("SELECT proj4_version();");
	        if (stmt01.step()) {
	            sb.append("\t").append("PROJ4_VERSION: " + stmt01.column_string(0));
	            sb.append("\n");
	        }

	        stmt01 = db.prepare("SELECT geos_version();");
	        if (stmt01.step()) {
	            sb.append("\t").append("GEOS_VERSION: " + stmt01.column_string(0));
	            sb.append("\n");
	        }
	        stmt01.close();
        }
        catch(Exception e){
        	callbackContext.error(e.getMessage());
        	e.printStackTrace();
        }

        sb.append("Done...\n");
        callbackContext.success(sb.toString());
    }

	/**
	 * Open connection to database.
	 * @param dbname
	 * @param callbackContext
	 */
	private void openDatabase(String dbname, CallbackContext callbackContext){
		Log.d("sqlite", "Open sqlite db: " + dbname);

		if(this.getDatabase(dbname) != null){
            this.closeDatabase(dbname);
        }
		File dbfile = this.cordova.getActivity().getDatabasePath(dbname + ".db");

		if (!dbfile.exists()) {
		    dbfile.getParentFile().mkdirs();
		}

        Database db = new Database();
        try{
        	db.open(dbfile.getAbsolutePath(),
        			jsqlite.Constants.SQLITE_OPEN_READWRITE |
        			jsqlite.Constants.SQLITE_OPEN_CREATE);
            dbmap.put(dbname, db);
            callbackContext.success();
        }
        catch (Exception e){
        	e.printStackTrace();
        	callbackContext.error(e.getMessage());
        }
	}
}
