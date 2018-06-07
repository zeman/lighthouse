/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Runner = require('../../../../runner');
const assert = require('assert');

const LanternEIL = require('../../../../gather/computed/metrics/lantern-estimated-input-latency');
const trace = require('../../../fixtures/traces/progressive-app-m60.json');
const devtoolsLog = require('../../../fixtures/traces/progressive-app-m60.devtools.log.json');

/* eslint-env mocha */

describe('Metrics: Lantern EIL', () => {
  it('should compute a simulated value', async () => {
    const artifacts = Runner.instantiateComputedArtifacts();
    const settings = {throttlingMethod: 'simulate'};
    const data = {trace, devtoolsLog, settings};
    const result = await artifacts.requestLanternEstimatedInputLatency(data);

    assert.equal(Math.round(result.timing), 100);
    assert.equal(Math.round(result.optimisticEstimate.timeInMs), 93);
    assert.equal(Math.round(result.pessimisticEstimate.timeInMs), 158);
  });

  describe('#getEventsAfterFMP', () => {
    it('should sort tasks', () => {
      const tasks = new Map([
        [{type: 'cpu'}, {startTime: 600, endTime: 700, duration: 100}],
        [{type: 'cpu'}, {startTime: 300, endTime: 400, duration: 100}],
        [{type: 'cpu'}, {startTime: 0, endTime: 100, duration: 100}],
        [{type: 'cpu'}, {startTime: 100, endTime: 200, duration: 100}],
        [{type: 'cpu'}, {startTime: 500, endTime: 600, duration: 100}],
        [{type: 'cpu'}, {startTime: 200, endTime: 300, duration: 100}],
        [{type: 'cpu'}, {startTime: 400, endTime: 500, duration: 100}],
      ]);

      assert.deepStrictEqual(LanternEIL.getEventsAfterFMP(tasks, 0), [
        {start: 0, end: 100, duration: 100},
        {start: 100, end: 200, duration: 100},
        {start: 200, end: 300, duration: 100},
        {start: 300, end: 400, duration: 100},
        {start: 400, end: 500, duration: 100},
        {start: 500, end: 600, duration: 100},
        {start: 600, end: 700, duration: 100},
      ]);
    });
  });
});
