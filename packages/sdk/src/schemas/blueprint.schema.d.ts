import { z } from 'zod';
export declare const blueprintStatusSchema: z.ZodEnum<["draft", "active", "archived"]>;
export declare const blueprintPlatformSchema: z.ZodEnum<["meta", "google", "linkedin", "snap"]>;
export declare const blueprintConfigSchema: z.ZodObject<{
    budget: z.ZodNumber;
    duration: z.ZodNumber;
    targetAudience: z.ZodObject<{
        age: z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
        }, {
            min: number;
            max: number;
        }>;
        locations: z.ZodArray<z.ZodString, "many">;
        interests: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        age: {
            min: number;
            max: number;
        };
        locations: string[];
        interests: string[];
    }, {
        age: {
            min: number;
            max: number;
        };
        locations: string[];
        interests: string[];
    }>;
    creative: z.ZodObject<{
        headline: z.ZodString;
        description: z.ZodString;
        imageUrl: z.ZodOptional<z.ZodString>;
        callToAction: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        headline: string;
        description: string;
        callToAction: string;
        imageUrl?: string | undefined;
    }, {
        headline: string;
        description: string;
        callToAction: string;
        imageUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    budget: number;
    duration: number;
    targetAudience: {
        age: {
            min: number;
            max: number;
        };
        locations: string[];
        interests: string[];
    };
    creative: {
        headline: string;
        description: string;
        callToAction: string;
        imageUrl?: string | undefined;
    };
}, {
    budget: number;
    duration: number;
    targetAudience: {
        age: {
            min: number;
            max: number;
        };
        locations: string[];
        interests: string[];
    };
    creative: {
        headline: string;
        description: string;
        callToAction: string;
        imageUrl?: string | undefined;
    };
}>;
export declare const createBlueprintSchema: z.ZodObject<{
    name: z.ZodString;
    platform: z.ZodEnum<["meta", "google", "linkedin", "snap"]>;
    config: z.ZodObject<{
        budget: z.ZodNumber;
        duration: z.ZodNumber;
        targetAudience: z.ZodObject<{
            age: z.ZodObject<{
                min: z.ZodNumber;
                max: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                min: number;
                max: number;
            }, {
                min: number;
                max: number;
            }>;
            locations: z.ZodArray<z.ZodString, "many">;
            interests: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        }, {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        }>;
        creative: z.ZodObject<{
            headline: z.ZodString;
            description: z.ZodString;
            imageUrl: z.ZodOptional<z.ZodString>;
            callToAction: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        }, {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        budget: number;
        duration: number;
        targetAudience: {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        };
        creative: {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        };
    }, {
        budget: number;
        duration: number;
        targetAudience: {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        };
        creative: {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        };
    }>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["draft", "active", "archived"]>>>;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "active" | "archived";
    name: string;
    platform: "meta" | "google" | "linkedin" | "snap";
    config: {
        budget: number;
        duration: number;
        targetAudience: {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        };
        creative: {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        };
    };
}, {
    name: string;
    platform: "meta" | "google" | "linkedin" | "snap";
    config: {
        budget: number;
        duration: number;
        targetAudience: {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        };
        creative: {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        };
    };
    status?: "draft" | "active" | "archived" | undefined;
}>;
export declare const updateBlueprintSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    platform: z.ZodOptional<z.ZodEnum<["meta", "google", "linkedin", "snap"]>>;
    config: z.ZodOptional<z.ZodObject<{
        budget: z.ZodNumber;
        duration: z.ZodNumber;
        targetAudience: z.ZodObject<{
            age: z.ZodObject<{
                min: z.ZodNumber;
                max: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                min: number;
                max: number;
            }, {
                min: number;
                max: number;
            }>;
            locations: z.ZodArray<z.ZodString, "many">;
            interests: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        }, {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        }>;
        creative: z.ZodObject<{
            headline: z.ZodString;
            description: z.ZodString;
            imageUrl: z.ZodOptional<z.ZodString>;
            callToAction: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        }, {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        budget: number;
        duration: number;
        targetAudience: {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        };
        creative: {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        };
    }, {
        budget: number;
        duration: number;
        targetAudience: {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        };
        creative: {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        };
    }>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<["draft", "active", "archived"]>>>>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "active" | "archived" | undefined;
    name?: string | undefined;
    platform?: "meta" | "google" | "linkedin" | "snap" | undefined;
    config?: {
        budget: number;
        duration: number;
        targetAudience: {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        };
        creative: {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        };
    } | undefined;
}, {
    status?: "draft" | "active" | "archived" | undefined;
    name?: string | undefined;
    platform?: "meta" | "google" | "linkedin" | "snap" | undefined;
    config?: {
        budget: number;
        duration: number;
        targetAudience: {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        };
        creative: {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        };
    } | undefined;
}>;
export declare const blueprintSchema: z.ZodObject<{
    name: z.ZodString;
    platform: z.ZodEnum<["meta", "google", "linkedin", "snap"]>;
    config: z.ZodObject<{
        budget: z.ZodNumber;
        duration: z.ZodNumber;
        targetAudience: z.ZodObject<{
            age: z.ZodObject<{
                min: z.ZodNumber;
                max: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                min: number;
                max: number;
            }, {
                min: number;
                max: number;
            }>;
            locations: z.ZodArray<z.ZodString, "many">;
            interests: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        }, {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        }>;
        creative: z.ZodObject<{
            headline: z.ZodString;
            description: z.ZodString;
            imageUrl: z.ZodOptional<z.ZodString>;
            callToAction: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        }, {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        budget: number;
        duration: number;
        targetAudience: {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        };
        creative: {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        };
    }, {
        budget: number;
        duration: number;
        targetAudience: {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        };
        creative: {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        };
    }>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["draft", "active", "archived"]>>>;
} & {
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "active" | "archived";
    name: string;
    platform: "meta" | "google" | "linkedin" | "snap";
    config: {
        budget: number;
        duration: number;
        targetAudience: {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        };
        creative: {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        };
    };
    id: string;
    createdAt: Date;
    updatedAt: Date;
}, {
    name: string;
    platform: "meta" | "google" | "linkedin" | "snap";
    config: {
        budget: number;
        duration: number;
        targetAudience: {
            age: {
                min: number;
                max: number;
            };
            locations: string[];
            interests: string[];
        };
        creative: {
            headline: string;
            description: string;
            callToAction: string;
            imageUrl?: string | undefined;
        };
    };
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status?: "draft" | "active" | "archived" | undefined;
}>;
export type BlueprintStatus = z.infer<typeof blueprintStatusSchema>;
export type BlueprintPlatform = z.infer<typeof blueprintPlatformSchema>;
export type BlueprintConfig = z.infer<typeof blueprintConfigSchema>;
export type CreateBlueprintInput = z.infer<typeof createBlueprintSchema>;
export type UpdateBlueprintInput = z.infer<typeof updateBlueprintSchema>;
export type Blueprint = z.infer<typeof blueprintSchema>;
//# sourceMappingURL=blueprint.schema.d.ts.map