"use strict";
/**
 * Copyright 2018, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalStats = exports.logger = void 0;
// types
__exportStar(require("./trace/types"), exports);
__exportStar(require("./trace/model/types"), exports);
__exportStar(require("./trace/config/types"), exports);
__exportStar(require("./trace/sampler/types"), exports);
__exportStar(require("./trace/instrumentation/types"), exports);
__exportStar(require("./trace/propagation/types"), exports);
__exportStar(require("./exporters/types"), exports);
__exportStar(require("./common/types"), exports);
__exportStar(require("./metrics/types"), exports);
__exportStar(require("./metrics/cumulative/types"), exports);
__exportStar(require("./metrics/gauges/types"), exports);
var types_1 = require("./metrics/export/types");
Object.defineProperty(exports, "MetricDescriptorType", { enumerable: true, get: function () { return types_1.MetricDescriptorType; } });
// classes
// domain models impls
__exportStar(require("./trace/model/tracer-base"), exports);
__exportStar(require("./trace/model/tracer"), exports);
// sampler impl
__exportStar(require("./trace/sampler/sampler"), exports);
// base instrumetation class
__exportStar(require("./trace/instrumentation/base-plugin"), exports);
// console exporter and buffer impls
__exportStar(require("./exporters/exporter-buffer"), exports);
__exportStar(require("./exporters/console-exporter"), exports);
// STATS CLASSES
// classes
__exportStar(require("./stats/view"), exports);
__exportStar(require("./stats/recorder"), exports);
__exportStar(require("./stats/bucket-boundaries"), exports);
__exportStar(require("./stats/metric-utils"), exports);
__exportStar(require("./tags/tag-map"), exports);
__exportStar(require("./tags/tagger"), exports);
__exportStar(require("./tags/propagation/binary-serializer"), exports);
__exportStar(require("./tags/propagation/text-format"), exports);
__exportStar(require("./resource/resource"), exports);
// interfaces
__exportStar(require("./stats/types"), exports);
var types_2 = require("./tags/types");
Object.defineProperty(exports, "TagTtl", { enumerable: true, get: function () { return types_2.TagTtl; } });
__exportStar(require("./resource/types"), exports);
// logger
const logger = require("./common/console-logger");
exports.logger = logger;
// version
__exportStar(require("./common/version"), exports);
// METRICS CLASSES
__exportStar(require("./metrics/metrics"), exports);
__exportStar(require("./metrics/metric-registry"), exports);
// Cumulative CLASSES
__exportStar(require("./metrics/cumulative/cumulative"), exports);
__exportStar(require("./metrics/cumulative/derived-cumulative"), exports);
// GAUGES CLASSES
__exportStar(require("./metrics/gauges/derived-gauge"), exports);
__exportStar(require("./metrics/gauges/gauge"), exports);
// Stats singleton instance
const stats_1 = require("./stats/stats");
const globalStats = stats_1.BaseStats.instance;
exports.globalStats = globalStats;
//# sourceMappingURL=index.js.map