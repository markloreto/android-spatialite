cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/org.yagajs.spatialite/www/websql-api.js",
        "id": "org.yagajs.spatialite.SpatialitePlugin",
        "clobbers": [
            "SpatialitePlugin"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-whitelist": "1.2.2",
    "org.yagajs.spatialite": "0.0.2"
};
// BOTTOM OF METADATA
});