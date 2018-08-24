/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const ArbitraryEqualityMap = require('../../lib/arbitrary-equality-map.js');

/**
 * Base class of computed artifacts. Derived classes should override the
 * `compute_` method with more specific `artifact` and return types to
 * implement a computed artifact.
*/
class ComputedArtifact {
  /**
   * @return {string}
   */
  get name() {
    throw new Error('name getter not implemented for computed artifact ' + this.constructor.name);
  }

  /* eslint-disable no-unused-vars */
  /**
   * @param {any} artifact
   * @return {Promise<any>}
   */
  async compute_(artifact) {
    throw new Error('innerCompute() not implemented for computed artifact ' +
      this.constructor.name);
  }
  /* eslint-enable no-unused-vars */

  /**
   * Request a computed artifact, caching the result based on the input
   * artifact(s). Types of `artifact` and the return value are inferred from the
   * `compute_` method on classes derived from ComputedArtifact.
   * @param {FirstParamType<this['compute_']>} artifact
   * @param {LH.Audit.Context} context
   * @return {Promise<ReturnType<this['compute_']>>}
   */
  async request(artifact, context) {
    const cache = context.computedCaches.get(this.name) || new ArbitraryEqualityMap();
    context.computedCaches.set(this.name, cache);

    const computed = /** @type {ReturnType<this['compute_']>|undefined} */ (cache.get(artifact));
    if (computed) {
      return computed;
    }

    const artifactPromise = this.compute_(artifact);
    cache.set(artifact, artifactPromise);

    return artifactPromise;
  }
}

module.exports = ComputedArtifact;
