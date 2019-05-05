var database = {
    info: function(callback){
        cordova.exec(
            function(message){
                callback(message);
            },
            function(){
                console.error("fail")
                callback(null);
            },
            "SpatiaLitePlugin",
            "info",
            [this.name]
        );
    },
    executeSql: function(sql, args, success, fail){
        cordova.exec(
            function(results){
                console.debug("Connected to " + name);
                success(results);
            },
            function(error){
                console.error("fail: " + error)
                fail(error);
            },
            "SpatiaLitePlugin",
            "executeSql",
            [this.name, sql]
        );
    }
};

var spatialite = {
    openDatabase: function(name, success, fail){
        cordova.exec(
            function(){
                database.name = name;
                console.debug("Connected to " + name);
                success(database);
            },
            function(){
                console.error("fail")
                fail(null);
            },
            "SpatiaLitePlugin",
            "openDatabase",
            [name]
        );
    }
};

module.exports = spatialite;