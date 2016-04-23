Building the Native libraries
========

Download the Android NDK (latest release as of now is r5). Follow the instructions on the website.
To make things easier, add the directory where you unpacked the NDK to your path:

`export PATH="$PATH:<path to your ndk directory"

You use the `ndk-build` script provided there to compile everything needed.

From the project root, use these steps:

`$ cd jni`
`$ ndk-build`

Reconfiguring (autoconf)
========

Generated headers for the dependent libraries have been checked in so you should not need to
reconfigure them. If you do for some reason, you may follow these instructions.

WARNING: This will likely break things as sources have been customized to work on Android.

- Setup some environment variables to make this easier:

 `export JDK_HOME=<path your JDK directory>`

- Configure libiconv:

 `cd jni/libiconv-1.13.1; ./configure`

- Configure proj:

 `cd jni/proj-4.7.0; ./configure`

- Configure spatialite/sqlite3 amalgamation:

 `cd jni/libspatialite-amalgamation-2.3.1; ./configure`

- Configure javasqlite:

 `sudo apt-get install libsqlite3-dev`

 `cd jni/javasqlite-20110106; ./configure --with-jdk=$JDK_HOME`

 `$JDK_HOME/bin/javac SQLite/Database.java SQLite/Vm.java SQLite/FunctionContext.java SQLite/Stmt.java SQLite/Blob.java SQLite/Backup.java SQLite/Profile.java`

 `$JDK_HOME/bin/javah -o native/sqlite_jni.h SQLite.Database SQLite.Vm SQLite.FunctionContext SQLite.Stmt SQLite.Blob SQLite.Backup SQLite.Profile`

Testing
=======

- Grab the spatialite test database from http://www.gaia-gis.it/spatialite-2.0/test.db.gz

- Unpack and push the database to your device's SD card:

 `adb push test.db /mnt/sdcard/spatialite_test.db`

- Run the SpatialiteTestActivity on your phone.


Cordova Plugin
========

The following outlines getting spatialite working as a Cordova plugin.

#### Deploy Spatialite Database with App

If you wish to use an existing spatialite database it needs to be [shipped with your app] (http://www.raymondcamden.com/index.cfm/2012/7/27/Guest-Blog-Post-Shipping-a-populated-SQLite-DB-with-PhoneGap) and copied to the database path the first time the app starts. e.g:

```
$ cp /path/to/mydb.sqlite /path/to/cordovaproject/platforms/android/assets/
```

And in your CordovaActivity onCreate have something like:

```
File dbFile = getDatabasePath("mydb.db");
if(!dbFile.exists()){
    String parentPath = dbFile.getParent();
    File filedir = new File(parentPath);
    if (!filedir.exists()) {
        if (!filedir.mkdirs()) {
            return;
        }
    }

    InputStream in = this.getApplicationContext().getAssets().open("mydb.sqlite");
    OutputStream out = new FileOutputStream(dbFile);

    byte[] buf = new byte[1024];
    int len; while ((len = in.read(buf)) > 0) out.write(buf, 0, len);
    in.close(); out.close();
}
```

#### Install Spatialite Libraries

Unpack [spatialite-for-android](http://www.gaia-gis.it/gaia-sins/spatialite-android/spatialite-for-android-3.0.1.zip) and copy libraries to [cordova](http://cordova.apache.org/) project, e.g:

```
$ cp /path/to/spatialite-for-android/spatialite-for-android/spatialite-android/spatialite-android-library/libs/* /path/to/cordovaproject/platforms/android/libs/
```

#### Install Plugin

```
$ cd /path/to/cordovaproject/
$ cordova plugin add https://github.com/edina/android-spatialite.git
```

#### Example Usage

```
window.SpatiaLitePlugin.openDatabase(
    'mydb',
    function(db){
        db.executeSql(
        'SELECT id, ST_AsText(geometry) FROM some_table WHERE ST_Within(geometry, BuildMbr(-2.4178, 55.8741, -2.2384, 55.8049))',
                [],
                function (results) {
                    for(var i in results){
                        console.log(results[i][0] + " : " + results[i][1]);
                    }
                },
                function(error){
                    console.log(error);
                }
            );
        },
        function(){
            console.log("Something went wrong with database.");
        }
    );

```
