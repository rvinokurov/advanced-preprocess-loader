"use strict";
var path = require("path");
var process = require("process");
var pp = require("preprocess");
var loaderUtils = require("loader-utils");
var lodash_1 = require("lodash");
var loader = function (content) {
    this.cachable && this.cachable();
    var resourcePath = this.resourcePath;
    console.log(this.resourcePath);
    if (typeof resourcePath !== 'string' || !resourcePath.length) {
        this.callback(null, content);
        return;
    }
    var extension = path.extname(this.resourcePath).substring(1);
    var options = {
        srcDir: this.context,
        type: extension
    }, query = loaderUtils.getOptions(this) || {};
    if (lodash_1.isObject(query.ppOptions)) {
        options = lodash_1.merge(options, query.ppOptions);
        delete query.ppOptions;
    }
    var context = lodash_1.merge({}, process.env, query);
    context.NODE_ENV = context.NODE_ENV || 'development';
    var processed = pp.preprocess(content, context, options);
    this.callback(null, processed);
};
module.exports = loader;
