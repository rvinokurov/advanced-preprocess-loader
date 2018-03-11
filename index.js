"use strict";
var path = require("path");
var fs = require("fs");
var process = require("process");
var crypto = require("crypto");
var pp = require("preprocess");
var loaderUtils = require("loader-utils");
var lodash_1 = require("lodash");
var algorithm = 'sha1', encoding = 'utf8', outputEncoding = 'hex', checksum = function (inputString) {
    return crypto
        .createHash(algorithm)
        .update(inputString, encoding)
        .digest(outputEncoding);
}, getTouchedFiles = function (ppLogFile) {
    try {
        return lodash_1.compact(fs.readFileSync(ppLogFile, encoding).split("\n"));
    }
    catch (e) {
        return [];
    }
}, saveTouchedFiles = function (ppLogFile, touchedFiles) {
    fs.writeFileSync(ppLogFile, touchedFiles.join("\n"));
};
var loader = function (content) {
    this.cacheable && this.cacheable();
    var resourcePath = this.resourcePath;
    console.log(this.resourcePath);
    if (typeof resourcePath !== 'string' || !resourcePath.length) {
        this.callback(null, content);
        return;
    }
    var extension = path.extname(this.resourcePath).substring(1), sourceChecksum = checksum(content), touchedFiles = [];
    var options = {
        srcDir: this.context,
        type: extension
    }, query = loaderUtils.getOptions(this) || {};
    if (lodash_1.isObject(query.ppOptions)) {
        options = lodash_1.merge(options, query.ppOptions);
        delete query.ppOptions;
    }
    if (typeof query.ppLogFile === 'string') {
        touchedFiles.push.apply(touchedFiles, getTouchedFiles(query.ppLogFile));
    }
    var context = lodash_1.merge({}, process.env, query);
    context.NODE_ENV = context.NODE_ENV || 'development';
    var processed = pp.preprocess(content, context, options);
    var processedChecksum = checksum(processed);
    console.log(sourceChecksum, processedChecksum);
    if (typeof query.ppLogFile === 'string' && sourceChecksum !== processedChecksum) {
        touchedFiles.push(resourcePath);
        saveTouchedFiles(query.ppLogFile, lodash_1.uniq(touchedFiles));
    }
    this.callback(null, processed);
};
module.exports = loader;
