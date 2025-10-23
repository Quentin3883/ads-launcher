"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchSchema = exports.createLaunchSchema = exports.launchStatusSchema = void 0;
const zod_1 = require("zod");
exports.launchStatusSchema = zod_1.z.enum([
    'pending',
    'running',
    'paused',
    'completed',
    'failed',
]);
exports.createLaunchSchema = zod_1.z.object({
    blueprintId: zod_1.z.string().uuid(),
    scheduledFor: zod_1.z.date().optional(),
});
exports.launchSchema = exports.createLaunchSchema.extend({
    id: zod_1.z.string().uuid(),
    status: exports.launchStatusSchema,
    externalCampaignId: zod_1.z.string().optional(),
    startedAt: zod_1.z.date().optional(),
    completedAt: zod_1.z.date().optional(),
    errorMessage: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
//# sourceMappingURL=launch.schema.js.map