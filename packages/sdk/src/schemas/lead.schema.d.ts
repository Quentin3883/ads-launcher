import { z } from 'zod';
export declare const leadSourceSchema: z.ZodEnum<["typeform", "meta_lead_ad", "google_lead_form", "linkedin_lead_gen", "snap_lead_gen", "other"]>;
export declare const createLeadSchema: z.ZodObject<{
    launchId: z.ZodString;
    source: z.ZodEnum<["typeform", "meta_lead_ad", "google_lead_form", "linkedin_lead_gen", "snap_lead_gen", "other"]>;
    externalLeadId: z.ZodOptional<z.ZodString>;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    launchId: string;
    source: "typeform" | "meta_lead_ad" | "google_lead_form" | "linkedin_lead_gen" | "snap_lead_gen" | "other";
    data: Record<string, unknown>;
    externalLeadId?: string | undefined;
}, {
    launchId: string;
    source: "typeform" | "meta_lead_ad" | "google_lead_form" | "linkedin_lead_gen" | "snap_lead_gen" | "other";
    data: Record<string, unknown>;
    externalLeadId?: string | undefined;
}>;
export declare const leadSchema: z.ZodObject<{
    launchId: z.ZodString;
    source: z.ZodEnum<["typeform", "meta_lead_ad", "google_lead_form", "linkedin_lead_gen", "snap_lead_gen", "other"]>;
    externalLeadId: z.ZodOptional<z.ZodString>;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
} & {
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    launchId: string;
    source: "typeform" | "meta_lead_ad" | "google_lead_form" | "linkedin_lead_gen" | "snap_lead_gen" | "other";
    data: Record<string, unknown>;
    externalLeadId?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    launchId: string;
    source: "typeform" | "meta_lead_ad" | "google_lead_form" | "linkedin_lead_gen" | "snap_lead_gen" | "other";
    data: Record<string, unknown>;
    externalLeadId?: string | undefined;
}>;
export type LeadSource = z.infer<typeof leadSourceSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type Lead = z.infer<typeof leadSchema>;
//# sourceMappingURL=lead.schema.d.ts.map