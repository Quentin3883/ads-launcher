"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blueprintSchema = exports.updateBlueprintSchema = exports.createBlueprintSchema = exports.blueprintConfigSchema = exports.blueprintPlatformSchema = exports.blueprintStatusSchema = void 0;
const zod_1 = require("zod");
exports.blueprintStatusSchema = zod_1.z.enum(['draft', 'active', 'archived']);
exports.blueprintPlatformSchema = zod_1.z.enum([
    'meta',
    'google',
    'linkedin',
    'snap',
]);
exports.blueprintConfigSchema = zod_1.z.object({
    budget: zod_1.z.number().positive(),
    duration: zod_1.z.number().int().positive(),
    targetAudience: zod_1.z.object({
        age: zod_1.z.object({
            min: zod_1.z.number().int().min(13),
            max: zod_1.z.number().int().max(65),
        }),
        locations: zod_1.z.array(zod_1.z.string()),
        interests: zod_1.z.array(zod_1.z.string()),
    }),
    creative: zod_1.z.object({
        headline: zod_1.z.string().min(1).max(255),
        description: zod_1.z.string().min(1).max(2000),
        imageUrl: zod_1.z.string().url().optional(),
        callToAction: zod_1.z.string().min(1).max(50),
    }),
});
exports.createBlueprintSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    platform: exports.blueprintPlatformSchema,
    config: exports.blueprintConfigSchema,
    status: exports.blueprintStatusSchema.optional().default('draft'),
});
exports.updateBlueprintSchema = exports.createBlueprintSchema.partial();
exports.blueprintSchema = exports.createBlueprintSchema.extend({
    id: zod_1.z.string().uuid(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
//# sourceMappingURL=blueprint.schema.js.map