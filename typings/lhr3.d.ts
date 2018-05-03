/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

declare global {
  module LH3 {
    /**
     * The lightweight version of Lighthouse results.
     */
    export interface Result extends LH.ResultLite {
      /** An object containing the results of the audits. */
      audits: Record<string, Result.Audit>;
      /** An object containing the top-level categories, their overall scores, and reference to member audits. */
      categories: Record<string, Result.Category>;

      // Additional non-LHR-lite information.
      /** Descriptions of the groups referenced by AuditRefs. */
      categoryGroups: Record<string, Result.CategoryGroup>;
      /** List of top-level warnings for this Lighthouse run. */
      runWarnings: string[];
      /** The User-Agent string of the browser used run Lighthouse for these results. */
      userAgent: string;
      /** Execution timings for the Lighthouse run. */
      timing: {total: number, [t: string]: number};
      /** The settings used for gathering these results. TODO */
      runtimeSettings: LH.Config.Settings;
    }

    // Result namespace
    export module Result {
      export interface Category extends LH.ResultLite.Category {
        /** An array of references to all the audit members of this category. */
        auditRefs: Result.AuditRef[];
      }

      export interface AuditRef extends LH.ResultLite.AuditRef {
        /** Optional grouping within the category. Matches a key in Result.categoryGroups. */
        groupId?: string;
      }

      export interface CategoryGroup {
        /** The title of the category group. */
        title: string;
        /** A brief description of the purpose of the category group. */
        description: string;
      }

      export interface Audit extends LH.ResultLite.Audit {
        /** A formatted (or formattable) string result for the audit. */
        displayValue: string;
        /** Extra information provided by some types of audits. */
        details: Audit.Details;
      }

      export module Audit {
        export type Details = LH.ResultLite.Audit.MetricDetails | LH.ResultLite.Audit.OpportunityDetails;
      }
    }
  }
}

// empty export to keep file a module
export {}
