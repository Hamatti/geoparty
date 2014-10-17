var getFiles = function() {

    var fs = require("fs"),
        path = require("path");

    var p = "questionsets/";

    return fs.readdirSync(p);
};

exports.getFiles = getFiles;
