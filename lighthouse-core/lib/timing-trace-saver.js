/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * Technically, it's fine for usertiming measures to overlap, however non-async events make
 * for a much clearer UI in traceviewer. We do this check to make sure we aren't passing off
 * async-like measures as non-async.
 * @param {!PerformanceEntry} entry user timing entry
 * @param {!Array<PerformanceEntry>} prevEntries user timing entries
 */
function checkEventOverlap(entry, prevEntries) {
  for (const prevEntry of prevEntries) {
    const prevEnd = prevEntry.startTime + prevEntry.duration;
    const thisEnd = entry.startTime + entry.duration;
    const isOverlap = prevEnd > entry.startTime && prevEnd < thisEnd;
    if (isOverlap) {
      throw new Error(`Two measures overlap! ${prevEntry.name} & ${entry.name}`);
    }
  }
}

/**
 * Generates a chromium trace file from user timing measures
 * Adapted from https://github.com/tdresser/performance-observer-tracing
 * @param {!Array<PerformanceEntry>=} entries user timing entries
 * @param {string=} threadName
 */
function generateTraceEvents(entries, threadName = 'measures') {
  if (!Array.isArray(entries)) return [];

  const currentTrace = /** @type {!LH.TraceEvent[]} */ ([]);
  let id = 0;

  entries.sort((a, b) => a.startTime - b.startTime);
  entries.forEach((entry, i) => {
    checkEventOverlap(entry, entries.slice(0, i));

    const traceEvent = {
      name: entry.name,
      cat: entry.entryType,
      ts: entry.startTime * 1000,
      dur: entry.duration * 1000,
      args: {},
      pid: 'Lighthouse',
      tid: threadName,
      ph: 'X',
      id: '0x' + (id++).toString(16),
    };

    if (entry.entryType !== 'measure') throw new Error('Unexpected entryType!');
    if (entry.duration === 0) {
      traceEvent.ph = 'n';
      traceEvent.s = 't';
    }

    currentTrace.push(traceEvent);
  });

  return currentTrace;
}

/**
 * Writes a trace file to disk
 * @param {LH.Result} lhr
 * @return {!string};
 */
function createTraceString(lhr) {
  const gatherEvents = generateTraceEvents(lhr.timing.gatherEntries, 'gather');
  const auditEvents = generateTraceEvents(lhr.timing.entries);
  const events = [...gatherEvents, ...auditEvents];

  const jsonStr = `
  { "traceEvents": [
    ${events.map(evt => JSON.stringify(evt)).join(',\n')}
  ]}`;

  return jsonStr;
}


module.exports = {generateTraceEvents, createTraceString};

