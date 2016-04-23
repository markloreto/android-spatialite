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
public class SpatialitePlugin extends CordovaPlugin {
	static HashMap<String, Database> dbmap = new HashMap<String, Database>();

	private void closeDatabase(String name){
		Database db = this.getDatabase(name);

		if(db != null){
			try{
				db.close();
			}
			catch(Exception ex){
				ex.printStackTrace();
			}
			dbmap.remove(name);
		}
	}

	/*
	 * (non-Javadoc)
	 * @see org.apache.cordova.CordovaPlugin#execute(java.lang.String, org.json.JSONArray, org.apache.cordova.CallbackContext)
	 */
	@Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("openDatabase")) {
            String name = args.getString(0);
			String path;

		    if (args.isNull(1)) {
				path = this.cordova.getActivity().getDatabasePath(name).getAbsolutePath();
			} else {
				path = args.getString(1);
			}

            this.openDatabase(name, path, callbackContext);
            return true;
        }
        if (action.equals("deleteDatabase")) {
            String name = args.getString(0);
            String path = args.getString(1);

            if (path == null) {
                path = this.cordova.getActivity().getDatabasePath(name).getAbsolutePath();
            }

            Log.v("spatialite", "delete " + name);
            this.deleteDatabase(name, path, callbackContext);
            return true;
        }
        else if(action.equals("executeSql")) {
        	String dbName = args.getString(0);
            String sql = args.getString(1);
            this.executeSql(dbName, sql, callbackContext);
            return true;
        }
        else if (action.equals("info")) {
            String name = args.getString(0);
            this.info(name, callbackContext);
            return true;
        }
        return false;
    }

	/**
	 * Get database from map cache.
	 * @param name name of database.
	 * @return Spatialite database.
	 */
	private Database getDatabase(String name){
		return dbmap.get(name);
	}

	/**
	 * Execute raw SQL
	 * @param dbName
	 * @param sql
	 * @param callbackContext
	 */
	private void executeSql(String name, final String sql, final CallbackContext callbackContext){
        Log.d("sqlite", name + " : " + sql);
		final Database db = this.getDatabase(name);


		cordova.getThreadPool().execute(new Runnable() {
        	public void run() {
				JSONObject response = new JSONObject();
				try {
		            Stmt stmt = db.prepare(sql);
		            JSONArray rows = new JSONArray();
		            while( stmt.step() ) {
		            	JSONObject row = new JSONObject();
		            	for(int i = 0; i < stmt.column_count(); i++){
		            		Object columnValue = stmt.column(i);
		            		row.put(stmt.column_name(i), columnValue == null ? stmt.column_string(i) : columnValue);
		            	}
		            	rows.put(row);
		            }
		            response.put("rows", rows);
		            response.put("rowsAffected", db.changes());

		            long insertId = db.last_insert_rowid();
		            if (insertId == -1L) {
		                insertId = 0;
		            }
		            response.put("insertId", insertId);

		            callbackContext.success(response);
		            stmt.close();
		        }
				catch (Exception e) {
					e.printStackTrace();
					callbackContext.error(e.getMessage());
		        }
			}
		});
	}

	/**
	 * Get database details.
	 * @param dbname
	 * @param callbackContext
	 */
	private void info(String name, CallbackContext callbackContext){
        Log.v("spatialite", "Info for: " + name);

        StringBuilder sb = new StringBuilder();
        sb.append("Check versions...\n");

        Database db = this.getDatabase(name);

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
	 * @param path
	 * @param callbackContext
	 */
	private void openDatabase(String name, String path, CallbackContext callbackContext){
		Log.d("spatialite", "Open sqlite db: " + path + " as " + name);

		if(this.getDatabase(name) != null){
            this.closeDatabase(name);
        }
		File dbfile = new File(path);

		if (!dbfile.exists()) {
		    dbfile.getParentFile().mkdirs();
		}

        Database db = new Database();
        try{
        	db.open(dbfile.getAbsolutePath(),
        			jsqlite.Constants.SQLITE_OPEN_READWRITE |
        			jsqlite.Constants.SQLITE_OPEN_CREATE);
            dbmap.put(name, db);
            callbackContext.success();
        }
        catch (Exception e){
        	e.printStackTrace();
        	callbackContext.error(e.getMessage());
        }
	}
	private void deleteDatabase(String name, String path, CallbackContext callbackContext) {
	    // File dbfile = this.cordova.getActivity().getDatabasePath(dbname);
		this.closeDatabase(name);

        File dbfile = new File(path);

        try {
            cordova.getActivity().deleteDatabase(dbfile.getAbsolutePath());
            callbackContext.success();
            return;
        } catch (Exception e) {
    	    e.printStackTrace();
    	    callbackContext.error(e.getMessage());
        }
    }

}
