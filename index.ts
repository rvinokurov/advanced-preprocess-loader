import * as path from 'path';
import * as fs from 'fs';
import * as process from 'process';
import * as crypto from 'crypto';
import * as pp from 'preprocess';
import * as loaderUtils from 'loader-utils';
import {isObject, merge, uniq, compact} from 'lodash';
import * as webpack from 'webpack';
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

  getTouchedFiles = (ppLogFile: string): string[] => {
    try {
      return compact(fs.readFileSync(ppLogFile, encoding).split("\n"));
    } catch (e) {
      return [];
    }
  },

  saveTouchedFiles = (ppLogFile: string, touchedFiles: string[]) : void =>  {
    fs.writeFileSync(ppLogFile, touchedFiles.join("\n"));
  };

const loader = function (this: LoaderContext, content: string): void {
  this.cacheable && this.cacheable();

  let {resourcePath} = this;

  if (typeof resourcePath !== 'string' || !resourcePath.length) {
    this.callback(null, content);
    return;
  }

  const
    extension = path.extname(this.resourcePath).substring(1),
    sourceChecksum = checksum(content),
    touchedFiles = [];

  let options = {
      srcDir: this.context,
      type: extension
    },
    query: OptionObject = loaderUtils.getOptions(this) || {};

  if (isObject(query.ppOptions)) {
    options = merge(options, query.ppOptions);
    delete query.ppOptions;
  }

  if (typeof query.ppLogFile === 'string') {
    touchedFiles.push(...getTouchedFiles(query.ppLogFile));
  }

  const context = merge({}, process.env, query);
  context.NODE_ENV = context.NODE_ENV || 'development';

  let processed: string = pp.preprocess(content, context, options);

  const processedChecksum = checksum(processed);

  if (typeof query.ppLogFile === 'string' && sourceChecksum !== processedChecksum) {
    touchedFiles.push(resourcePath);
    saveTouchedFiles(query.ppLogFile, uniq(touchedFiles));
  }

  this.callback(null, processed);
};

export = loader;