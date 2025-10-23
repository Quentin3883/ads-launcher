"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
exports.getEnv = getEnv;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(['development', 'test', 'production'])
        .default('development'),
    DATABASE_URL: zod_1.z.string().url(),
    API_PORT: zod_1.z.coerce.number().int().positive().default(4000),
    API_HOST: zod_1.z.string().default('localhost'),
});
function validateEnv(env) {
    const parsed = envSchema.safeParse(env);
    if (!parsed.success) {
        console.error('❌ Invalid environment variables:');
        console.error(JSON.stringify(parsed.error.format(), null, 2));
        throw new Error('Invalid environment variables');
    }
    return parsed.data;
}
function getEnv() {
    return validateEnv(process.env);
}
//# sourceMappingURL=env.js.map