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
  if (!IntlPolyfill.NumberFormat) throw new Error('Invalid polyfill');

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
 * @param {string} template
 * @param {Record<string, *>} [values]
 */
function preprocessMessageValues(template, values) {
  if (!values) return;

  const clonedValues = JSON.parse(JSON.stringify(values));
  const parsed = MessageParser.parse(template);
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
 * @prop {string} templateID
 * @prop {string} template
 * @prop {*} [values]
 */

/** @type {Map<string, StringUsage[]>} */
const formattedStringUsages = new Map();

/**
 *
 * @param {LH.Locale} locale
 * @param {string} templateID
 * @param {string} template
 * @param {*} [values]
 */
function _formatTemplate(locale, templateID, template, values) {
  const localeTemplates = LOCALES[locale] || {};
  const localeTemplate = localeTemplates[templateID] && localeTemplates[templateID].message;
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

/** @param {string[]} pathInLHR */
function _formatPathAsString(pathInLHR) {
  let pathAsString = '';
  for (const property of pathInLHR) {
    if (/^[a-z]+$/i.test(property)) {
      if (pathAsString.length) pathAsString += '.';
      pathAsString += property;
    } else {
      if (/]|"|'|\s/.test(property)) throw new Error(`Cannot handle "${property}" in i18n`);
      pathAsString += `[${property}]`;
    }
  }

  return pathAsString;
}

/**
 * @return {LH.Locale}
 */
function getDefaultLocale() {
  const defaultLocale = MessageFormat.defaultLocale;
  if (defaultLocale in LOCALES) return /** @type {LH.Locale} */ (defaultLocale);
  return 'en-US';
}

/**
 * @param {string} filename
 * @param {Record<string, string>} fileStrings
 */
function createStringFormatter(filename, fileStrings) {
  const mergedStrings = {...UIStrings, ...fileStrings};

  /** @param {string} template @param {*} [values] */
  const formatFn = (template, values) => {
    const keyname = Object.keys(mergedStrings).find(key => mergedStrings[key] === template);
    if (!keyname) throw new Error(`Could not locate: ${template}`);

    const filenameToLookup = keyname in UIStrings ? __filename : filename;
    const unixStyleFilename = path.relative(LH_ROOT, filenameToLookup).replace(/\\/g, '/');
    const templateID = `${unixStyleFilename} | ${keyname}`;
    const templateUsages = formattedStringUsages.get(templateID) || [];
    templateUsages.push({templateID, template, values});
    formattedStringUsages.set(templateID, templateUsages);

    return `${templateID} # ${templateUsages.length - 1}`;
  };

  return formatFn;
}

/**
 * @param {LH.Result} lhr
 * @param {LH.Locale} locale
 */
function replaceLocaleStringReferences(lhr, locale) {
  /**
   * @param {*} objectInLHR
   * @param {LH.I18NMessages} messages
   * @param {string[]} pathInLHR
   */
  function replaceInObject(objectInLHR, messages, pathInLHR = []) {
    if (typeof objectInLHR !== 'object' || !objectInLHR) return;

    for (const [property, value] of Object.entries(objectInLHR)) {
      const currentPathInLHR = pathInLHR.concat([property]);

      // Check to see if the value in the LHR looks like a string reference. If it is, replace it.
      if (typeof value === 'string' && /.* \| .* # \d+$/.test(value)) {
        // @ts-ignore - Guaranteed to match from .test call above
        const [_, templateID, usageIndex] = value.match(/(.*) # (\d+)$/);
        const templateUsagesInLHR = messages[templateID] || [];
        const usages = formattedStringUsages.get(templateID) || [];
        const usage = usages[Number(usageIndex)];
        const pathAsString = _formatPathAsString(currentPathInLHR);
        templateUsagesInLHR.push(
          usage.values ? {values: usage.values, path: pathAsString} : pathAsString
        );

        const {message} = _formatTemplate(locale, templateID, usage.template, usage.values);

        objectInLHR[property] = message;
        messages[templateID] = templateUsagesInLHR;
      } else {
        replaceInObject(value, messages, currentPathInLHR);
      }
    }
  }

  const messages = {};
  replaceInObject(lhr, messages);
  lhr.i18n = {messages};
}

module.exports = {
  _formatPathAsString,
  UIStrings,
  getDefaultLocale,
  createStringFormatter,
  replaceLocaleStringReferences,
};
