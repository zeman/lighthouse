/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
const MessageFormat = require('intl-messageformat').default;
const MessageParser = require('intl-messageformat-parser');
const LOCALES = require('./locales');

const LH_ROOT = path.join(__dirname, '../../');

try {
  // Node usually doesn't come with the locales we want built-in, so load the polyfill.
  // In browser environments, we won't need the polyfill, and this will throw so wrap in try/catch.

  // @ts-ignore
  const IntlPolyfill = require('intl');
  // @ts-ignore
  Intl.NumberFormat = IntlPolyfill.NumberFormat;
  // @ts-ignore
  Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;
} catch (_) {}

const UIStrings = {
  ms: '{timeInMs, number, milliseconds}\xa0ms',
  columnURL: 'URL',
  columnSize: 'Size (KB)',
  columnWastedTime: 'Potential Savings (ms)',
};

const formats = {
  number: {
    milliseconds: {
      maximumFractionDigits: 0,
    },
  },
};

/**
 * @param {string} msg
 * @param {Record<string, *>} [values]
 */
function preprocessMessageValues(msg, values) {
  if (!values) return;

  const clonedValues = JSON.parse(JSON.stringify(values));
  const parsed = MessageParser.parse(msg);
  // Round all milliseconds to 10s place
  parsed.elements
    .filter(el => el.format && el.format.style === 'milliseconds')
    .forEach(el => (clonedValues[el.id] = Math.round(clonedValues[el.id] / 10) * 10));

  // Replace all the bytes with KB
  parsed.elements
    .filter(el => el.format && el.format.style === 'bytes')
    .forEach(el => (clonedValues[el.id] = clonedValues[el.id] / 1024));

  return clonedValues;
}

/**
 * @typedef StringUsage
 * @prop {string} key
 * @prop {string} template
 * @prop {*} [values]
 */

/** @type {Map<string, StringUsage[]>} */
const formattedStringUsages = new Map();

/**
 *
 * @param {LH.Locale} locale
 * @param {string} templateKey
 * @param {string} template
 * @param {*} [values]
 */
function formatTemplate(locale, templateKey, template, values) {
  const localeTemplates = LOCALES[locale] || {};
  const localeTemplate = localeTemplates[templateKey] && localeTemplates[templateKey].message;
  // fallback to the original english message if we couldn't find a message in the specified locale
  // better to have an english message than no message at all, in some number cases it won't even matter
  const templateForMessageFormat = localeTemplate || template;
  // when using accented english, force the use of a different locale for number formatting
  const localeForMessageFormat = locale === 'en-XA' ? 'de-DE' : locale;
  // pre-process values for the message format like KB and milliseconds
  const valuesForMessageFormat = preprocessMessageValues(template, values);

  const formatter = new MessageFormat(templateForMessageFormat, localeForMessageFormat, formats);
  const message = formatter.format(valuesForMessageFormat);

  return {message, template: templateForMessageFormat};
}

/** @param {string[]} path */
function formatPathAsString(path) {
  let pathAsString = '';
  for (const property of path) {
    if (/^[a-z]+$/i.test(property)) {
      if (pathAsString.length) pathAsString += '.';
      pathAsString += property;
    } else {
      if (/]|"|'/.test(property)) throw new Error(`Cannot handle "${property}" in i18n`);
      pathAsString += `[${property}]`;
    }
  }

  return pathAsString;
}

module.exports = {
  UIStrings,
  formatPathAsString,
  /**
   * @return {LH.Locale}
   */
  getDefaultLocale() {
    const defaultLocale = MessageFormat.defaultLocale;
    if (defaultLocale in LOCALES) return /** @type {LH.Locale} */ (defaultLocale);
    return 'en-US';
  },
  /**
   * @param {string} filename
   * @param {Record<string, string>} fileStrings
   */
  createStringFormatter(filename, fileStrings) {
    const mergedStrings = {...UIStrings, ...fileStrings};

    /** @param {string} template @param {*} [values] */
    const formatFn = (template, values) => {
      const keyname = Object.keys(mergedStrings).find(key => mergedStrings[key] === template);
      if (!keyname) throw new Error(`Could not locate: ${template}`);

      const filenameToLookup = keyname in UIStrings ? __filename : filename;
      const unixStyleFilename = path.relative(LH_ROOT, filenameToLookup).replace(/\\/g, '/');
      const key = unixStyleFilename + '!#' + keyname;
      const keyUsages = formattedStringUsages.get(key) || [];
      keyUsages.push({key, template, values});
      formattedStringUsages.set(key, keyUsages);

      return `${key}#${keyUsages.length - 1}`;
    };

    return formatFn;
  },
  /**
   * @param {LH.Result} lhr
   * @param {LH.Locale} locale
   */
  replaceLocaleStringReferences(lhr, locale) {
    /**
     * @param {*} objectInLHR
     * @param {LH.LocaleLog} log
     * @param {string[]} path
     */
    function replaceInObject(objectInLHR, log, path = []) {
      if (typeof objectInLHR !== 'object' || !objectInLHR) return;

      for (const [property, value] of Object.entries(objectInLHR)) {
        const currentPath = path.concat([property]);

        if (typeof value === 'string' && /.*!#.*#\d+$/.test(value)) {
          // @ts-ignore - Guaranteed to match from .test call above
          const [_, templateKey, usageIndex] = value.match(/(.*)#(\d+)$/);
          const templateLogRecord = log[templateKey] || [];
          const usages = formattedStringUsages.get(templateKey) || [];
          const usage = usages[Number(usageIndex)];
          const pathAsString = formatPathAsString(currentPath);
          templateLogRecord.push(
            usage.values ? {values: usage.values, path: pathAsString} : pathAsString
          );

          const {message} = formatTemplate(locale, templateKey, usage.template, usage.values);

          objectInLHR[property] = message;
          log[templateKey] = templateLogRecord;
        } else {
          replaceInObject(value, log, currentPath);
        }
      }
    }

    const log = {};
    replaceInObject(lhr, log);
    lhr.localeLog = log;
  },
};
