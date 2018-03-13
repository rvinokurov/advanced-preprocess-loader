"use strict";
var path = require("path");
var process = require("process");
var crypto = require("crypto");
var pp = require("preprocess");
var loaderUtils = require("loader-utils");
var lodash_1 = require("lodash");
var mkdirp = require("mkdirp");
var fs = require("fs");
var algorithm = 'sha1', encoding = 'utf8', outputEncoding = 'hex', checksum = function (inputString) {
    return crypto
        .createHash(algorithm)
        .update(inputString, encoding)
        .digest(outputEncoding);
}, md5 = function (inputString) {
    return crypto
        .createHash('md5')
        .update(inputString, encoding)
        .digest(outputEncoding);
};
var createCacheFile = function (directory, resourcePath) {
    mkdirp(directory, function (error) {
        if (error) {
            console.error(error);
        }
        else {
            fs.writeFile(path.join(directory, md5(resourcePath)), '', { encoding: encoding }, function (error) {
                if (error) {
                    console.error(error);
                }
                else {
                    // console.log('write', resourcePath);
                }
            });
        }
    });
};
var loader = function (content) {
    this.cacheable && this.cacheable();
    var resourcePath = this.resourcePath;
    if (typeof resourcePath !== 'string' || !resourcePath.length) {
        this.callback(null, content);
        return;
    }
    content = lodash_1.trim(content);
    var extension = path.extname(this.resourcePath).substring(1), sourceChecksum = checksum(content);
    var options = {
        srcDir: this.context,
        type: extension
    }, query = loaderUtils.getOptions(this) || {};
    var preprocessCache = query.preprocessCache;
    if (lodash_1.isObject(query.ppOptions)) {
        options = lodash_1.merge(options, query.ppOptions);
    }
    var context = lodash_1.merge({}, process.env, query.context || {});
    context.NODE_ENV = context.NODE_ENV || 'development';
    var processed = lodash_1.trim(pp.preprocess(content, context, options));
    var processedChecksum = checksum(processed);
    if (sourceChecksum !== processedChecksum && typeof preprocessCache === 'string' && preprocessCache.length) {
        // console.log(resourcePath);
        createCacheFile(preprocessCache, resourcePath);
    }
    this.callback(null, processed);
};
module.exports = loader;
