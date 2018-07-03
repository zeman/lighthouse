/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Runner = require('../../../../runner');
const assert = require('assert');

const LanternFCPUI = require('../../../../gather/computed/metrics/lantern-first-cpu-idle');
const trace = require('../../../fixtures/traces/progressive-app-m60.json');
const devtoolsLog = require('../../../fixtures/traces/progressive-app-m60.devtools.log.json');

/* eslint-env jest */
describe('Metrics: Lantern TTFCPUI', () => {
  it('should compute predicted value', async () => {
    const artifacts = Runner.instantiateComputedArtifacts();
    const result = await artifacts.requestLanternFirstCPUIdle({trace, devtoolsLog, settings: {}});

    assert.equal(Math.round(result.timing), 4309);
    assert.equal(Math.round(result.optimisticEstimate.timeInMs), 2451);
    assert.equal(Math.round(result.pessimisticEstimate.timeInMs), 2752);
    assert.equal(result.optimisticEstimate.nodeTimings.size, 19);
    assert.equal(result.pessimisticEstimate.nodeTimings.size, 79);
    assert.ok(result.optimisticGraph, 'should have created optimistic graph');
    assert.ok(result.pessimisticGraph, 'should have created pessimistic graph');
  });

  describe('#getFirstCPUIdleWindowStart', () => {
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

      assert.equal(LanternFCPUI.getFirstCPUIdleWindowStart(tasks, 0), 700);
    });
  });
});
