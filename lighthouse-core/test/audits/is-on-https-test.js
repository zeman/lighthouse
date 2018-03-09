/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../../audits/is-on-https.js');
const assert = require('assert');

/* eslint-env mocha */

describe('Security: HTTPS audit', () => {
  function getArtifacts(networkRecords) {
    return {
      devtoolsLogs: {[Audit.DEFAULT_PASS]: []},
      requestNetworkRecords: () => Promise.resolve(networkRecords),
    };
  }
  const securityState = _ => 'secure';
  const insecure = _ => 'insecure';

  it('fails when there is more than one insecure record', () => {
    return Audit.audit(
      getArtifacts([
        {url: 'https://google.com/', scheme: 'https', domain: 'google.com', securityState},
        {
          url: 'http://insecure.com/image.jpeg',
          scheme: 'http',
          domain: 'insecure.com',
          securityState: insecure,
        },
        {
          url: 'http://insecure.com/image2.jpeg',
          scheme: 'http',
          domain: 'insecure.com',
          securityState: insecure,
        },
        {url: 'https://google.com/', scheme: 'https', domain: 'google.com', securityState},
      ])
    ).then(result => {
      assert.strictEqual(result.rawValue, false);
      assert.ok(result.displayValue.includes('requests found'));
      assert.strictEqual(result.extendedInfo.value.length, 2);
    });
  });

  it('fails when there is one insecure record', () => {
    return Audit.audit(
      getArtifacts([
        {url: 'https://google.com/', scheme: 'https', domain: 'google.com', securityState},
        {
          url: 'http://insecure.com/image.jpeg',
          scheme: 'http',
          domain: 'insecure.com',
          securityState: insecure,
        },
        {url: 'https://google.com/', scheme: 'https', domain: 'google.com', securityState},
      ])
    ).then(result => {
      assert.strictEqual(result.rawValue, false);
      assert.ok(result.displayValue.includes('request found'));
      assert.deepEqual(result.extendedInfo.value[0], {url: 'http://insecure.com/image.jpeg'});
    });
  });

  // Upgrade-Insecure-Requests will turn http references to https. If the requests fail, we want to know
  it('fails when there is a failed-to-upgrade request', () => {
    return Audit.audit(
      getArtifacts([
        {url: 'https://google.com/', scheme: 'https', domain: 'google.com', securityState},
        {
          url: 'https://upgraded.com/image.jpg',
          scheme: 'https',
          domain: 'upgraded.com',
          securityState: insecure,
        },
      ])
    ).then(result => {
      assert.strictEqual(result.rawValue, false);
      assert.ok(result.displayValue.includes('request found'));
      assert.deepEqual(result.extendedInfo.value[0], {url: 'https://upgraded.com/image.jpg'});
    });
  });

  it('passes when all records are secure', () => {
    return Audit.audit(
      getArtifacts([
        {url: 'https://google.com/', scheme: 'https', domain: 'google.com', securityState},
        {
          url: 'http://localhost/image.jpeg',
          scheme: 'http',
          domain: 'localhost',
          securityState: insecure,
        },
        {url: 'https://google.com/', scheme: 'https', domain: 'google.com', securityState},
      ])
    ).then(result => {
      assert.strictEqual(result.rawValue, true);
    });
  });

  describe('#isSecureRecord', () => {
    it('correctly identifies insecure records', () => {
      assert.strictEqual(
        Audit.isSecureRecord({scheme: 'http', domain: 'google.com', securityState: insecure}),
        false
      );
      assert.strictEqual(
        Audit.isSecureRecord({scheme: 'http', domain: '54.33.21.23', securityState: insecure}),
        false
      );
      assert.strictEqual(
        Audit.isSecureRecord({scheme: 'ws', domain: 'my-service.com', securityState: insecure}),
        false
      );
      assert.strictEqual(
        Audit.isSecureRecord({scheme: '', domain: 'google.com', securityState: insecure}),
        false
      );
    });

    it('correctly identifies secure records', () => {
      assert.strictEqual(
        Audit.isSecureRecord({scheme: 'http', domain: 'localhost', securityState}),
        true
      );
      assert.strictEqual(
        Audit.isSecureRecord({scheme: 'https', domain: 'google.com', securityState}),
        true
      );
      assert.strictEqual(
        Audit.isSecureRecord({scheme: 'wss', domain: 'my-service.com', securityState}),
        true
      );
      assert.strictEqual(Audit.isSecureRecord({scheme: 'data', domain: '', securityState}), true);
      assert.strictEqual(Audit.isSecureRecord({scheme: 'blob', domain: '', securityState}), true);
      assert.strictEqual(
        Audit.isSecureRecord({scheme: '', protocol: 'blob', domain: '', securityState}),
        true
      );
      assert.strictEqual(Audit.isSecureRecord({scheme: 'chrome', domain: '', securityState}), true);
      assert.strictEqual(
        Audit.isSecureRecord({scheme: 'chrome-extension', domain: '', securityState}),
        true
      );
    });

    it('correctly handles failed-to-upgrade requests', () => {
      assert.strictEqual(
        Audit.isSecureRecord({scheme: 'https', domain: 'upgraded.com', securityState: insecure}),
        false
      );
    });
  });
});
