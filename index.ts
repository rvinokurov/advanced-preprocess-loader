import * as path from 'path';
import * as process from 'process';
import * as crypto from 'crypto';
import * as pp from 'preprocess';
import * as loaderUtils from 'loader-utils';
import {isObject, merge, uniq, compact, trim, isFunction} from 'lodash';
import * as webpack from 'webpack';
import * as mkdirp from 'mkdirp';
import * as fs from 'fs';
import LoaderContext = webpack.loader.LoaderContext;
import {OptionObject} from 'loader-utils';
const
  algorithm = 'sha1',
  encoding = 'utf8',
  outputEncoding = 'hex',

  checksum = (inputString: string): string => {
    return crypto
      .createHash(algorithm)
      .update(inputString, encoding)
      .digest(outputEncoding);
  },
  md5 = (inputString: string): string => {
    return crypto
      .createHash('md5')
      .update(inputString, encoding)
      .digest(outputEncoding);
  };

const createCacheFile = (directory: string, resourcePath: string) : void => {
  mkdirp(directory, (error) => {
    if(error) {
      console.error(error);
    } else {
      fs.writeFile(
        path.join(directory, md5(resourcePath)),
        '',
        {encoding},
        (error) => {
          if(error) {
            console.error(error);
          } else {
            // console.log('write', resourcePath);
          }
      });
    }
  })
};


const loader = function (this: LoaderContext, content: string): void {
  this.cacheable && this.cacheable();

  let {resourcePath} = this;

  if (typeof resourcePath !== 'string' || !resourcePath.length) {
    this.callback(null, content);
    return;
  }
  content = trim(content);

  const
    extension = path.extname(this.resourcePath).substring(1),
    sourceChecksum = checksum(content);

  let options = {
      srcDir: this.context,
      type: extension
    },
    query: OptionObject = loaderUtils.getOptions(this) || {};

  const {preprocessCache} = query;

  if (isObject(query.ppOptions)) {
    options = merge(options, query.ppOptions);
  }

  const context = merge({}, process.env, query.context || {});
  context.NODE_ENV = context.NODE_ENV || 'development';

  let processed: string = trim(pp.preprocess(content, context, options));

  const processedChecksum = checksum(processed);

  if (sourceChecksum !== processedChecksum && typeof preprocessCache === 'string' && preprocessCache.length) {
    // console.log(resourcePath);
    createCacheFile(preprocessCache, resourcePath);
  }

  this.callback(null, processed);
};

export = loader;