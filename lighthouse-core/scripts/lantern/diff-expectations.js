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
const execSync = require('child_process').execSync;

const COMPUTED_INPUT_ARG = process.argv[2] || './lantern-data/lantern-computed.json';
const COMPUTED_PATH = path.join(process.cwd(), COMPUTED_INPUT_ARG);
const EXPECTED_PATH = path.join(__dirname, '../../test/fixtures/lantern-expectations.json');

const TMP_DIR = path.join(process.cwd(), '.tmp');
const TMP_COMPUTED = path.join(TMP_DIR, 'computed.json');
const TMP_EXPECTED = path.join(TMP_DIR, 'expected.json');

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

if (!fs.existsSync(COMPUTED_PATH) || !fs.existsSync(EXPECTED_PATH)) {
  throw new Error('Usage $0 <computed file>');
}

try {
  const computedResults = require(COMPUTED_PATH);
  const expectedResults = require(EXPECTED_PATH);

  const sites = [];
  for (const entry of computedResults.sites) {
    const lanternValues = entry.lantern;
    Object.keys(lanternValues).forEach(key => lanternValues[key] = Math.round(lanternValues[key]));
    sites.push({url: entry.url, ...lanternValues});
  }

  fs.writeFileSync(TMP_COMPUTED, JSON.stringify({sites}, null, 2));
  fs.writeFileSync(TMP_EXPECTED, JSON.stringify(expectedResults, null, 2));

  try {
    execSync(`git --no-pager diff --color=always --no-index ${TMP_EXPECTED} ${TMP_COMPUTED}`);
    console.log('✅  PASS    No changes between expected and computed!');
  } catch (err) {
    console.log('❌  FAIL    Changes between expected and computed!\n');
    console.log(err.stdout.toString());
  }
} finally {
  fs.unlinkSync(TMP_COMPUTED);
  fs.unlinkSync(TMP_EXPECTED);
}
