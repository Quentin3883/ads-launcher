import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    DATABASE_URL: z.ZodString;
    API_PORT: z.ZodDefault<z.ZodNumber>;
    API_HOST: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "test" | "production";
    DATABASE_URL: string;
    API_PORT: number;
    API_HOST: string;
}, {
    DATABASE_URL: string;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    API_PORT?: number | undefined;
    API_HOST?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare function validateEnv(env: NodeJS.ProcessEnv): Env;
export declare function getEnv(): Env;
export {};
//# sourceMappingURL=env.d.ts.map