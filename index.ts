import * as path from 'path';
import * as process from 'process';
import * as pp from 'preprocess';
import * as loaderUtils from 'loader-utils';
import {isObject, merge} from 'lodash';


const loader = function (content) {
    this.cachable && this.cachable();

    let {resourcePath} = this;

    console.log(this.resourcePath);

    if(typeof resourcePath !== 'string' || !resourcePath.length) {
        this.callback(null,  content);
        return;
    }

    const
        extension = path.extname(this.resourcePath).substring(1);

    let options = {
            srcDir :this.context,
            type : extension
        },
        query = loaderUtils.getOptions(this) || {};

    if(isObject(query.ppOptions)) {
        options = merge(options, query.ppOptions);
        delete query.ppOptions;
    }
    const context = merge({}, process.env, query);
    context.NODE_ENV = context.NODE_ENV || 'development';

    let processed = pp.preprocess(content, context, options);

    this.callback(null, processed);
};

export = loader;