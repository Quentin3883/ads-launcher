import { z } from 'zod';
export declare const launchStatusSchema: z.ZodEnum<["pending", "running", "paused", "completed", "failed"]>;
export declare const createLaunchSchema: z.ZodObject<{
    blueprintId: z.ZodString;
    scheduledFor: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    blueprintId: string;
    scheduledFor?: Date | undefined;
}, {
    blueprintId: string;
    scheduledFor?: Date | undefined;
}>;
export declare const launchSchema: z.ZodObject<{
    blueprintId: z.ZodString;
    scheduledFor: z.ZodOptional<z.ZodDate>;
} & {
    id: z.ZodString;
    status: z.ZodEnum<["pending", "running", "paused", "completed", "failed"]>;
    externalCampaignId: z.ZodOptional<z.ZodString>;
    startedAt: z.ZodOptional<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    errorMessage: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "running" | "paused" | "completed" | "failed";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    blueprintId: string;
    scheduledFor?: Date | undefined;
    externalCampaignId?: string | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
    errorMessage?: string | undefined;
}, {
    status: "pending" | "running" | "paused" | "completed" | "failed";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    blueprintId: string;
    scheduledFor?: Date | undefined;
    externalCampaignId?: string | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
    errorMessage?: string | undefined;
}>;
export type LaunchStatus = z.infer<typeof launchStatusSchema>;
export type CreateLaunchInput = z.infer<typeof createLaunchSchema>;
export type Launch = z.infer<typeof launchSchema>;
//# sourceMappingURL=launch.schema.d.ts.map