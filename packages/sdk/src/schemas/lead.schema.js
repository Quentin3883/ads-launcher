"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadSchema = exports.createLeadSchema = exports.leadSourceSchema = void 0;
const zod_1 = require("zod");
exports.leadSourceSchema = zod_1.z.enum([
    'typeform',
    'meta_lead_ad',
    'google_lead_form',
    'linkedin_lead_gen',
    'snap_lead_gen',
    'other',
]);
exports.createLeadSchema = zod_1.z.object({
    launchId: zod_1.z.string().uuid(),
    source: exports.leadSourceSchema,
    externalLeadId: zod_1.z.string().optional(),
    data: zod_1.z.record(zod_1.z.unknown()),
});
exports.leadSchema = exports.createLeadSchema.extend({
    id: zod_1.z.string().uuid(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
//# sourceMappingURL=lead.schema.js.map