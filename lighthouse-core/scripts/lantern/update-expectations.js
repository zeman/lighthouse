#!/usr/bin/env node
/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const execFileSync = require('child_process').execFileSync;
const prettyJSONStringify = require('pretty-json-stringify');

const INPUT_PATH = process.argv[2] || './lantern-data/lantern-expectations.json';
const EXPECTATIONS_PATH = path.resolve(process.cwd(), INPUT_PATH);
const EXPECTATIONS_DIR = path.dirname(EXPECTATIONS_PATH);
const COMPUTED_PATH = path.join(EXPECTATIONS_DIR, 'lantern-computed.json');
const RUN_ALL_SCRIPT_PATH = path.join(__dirname, 'run-all-expectations.js');
const OUTPUT_PATH = path.join(__dirname, '../../test/fixtures/lantern-expectations.json');

if (!fs.existsSync(COMPUTED_PATH) || process.env.FORCE) {
  if (!fs.existsSync(EXPECTATIONS_PATH)) throw new Error('Usage $0 <expectations file>');
  console.log(RUN_ALL_SCRIPT_PATH, EXPECTATIONS_PATH);
  execFileSync(RUN_ALL_SCRIPT_PATH, [EXPECTATIONS_PATH]);
}

const computedResults = require(COMPUTED_PATH);

const sites = [];
for (const entry of computedResults.sites) {
  const lanternValues = entry.lantern;
  Object.keys(lanternValues).forEach(key => lanternValues[key] = Math.round(lanternValues[key]));
  sites.push({url: entry.url, ...lanternValues});
}

fs.writeFileSync(OUTPUT_PATH, prettyJSONStringify({sites}, {
  tab: '  ',
  spaceBeforeColon: '',
  spaceInsideObject: '',
  shouldExpand: (_, level) => level < 2,
}));


