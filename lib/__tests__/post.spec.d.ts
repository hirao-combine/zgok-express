import { z } from "zod";
export declare const SampleSchema: {
    dir1: {
        hoge1: {
            method: "get" | "post" | "patch" | "put" | "delete";
            req: z.ZodObject<{
                id: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                id: number;
            }, {
                id: number;
            }>;
            res: z.ZodObject<{
                name1: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name1: string;
            }, {
                name1: string;
            }>;
        };
        err2: {
            method: "get" | "post" | "patch" | "put" | "delete";
            req: z.ZodObject<{
                id: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                id: number;
            }, {
                id: number;
            }>;
            res: z.ZodObject<{
                name2: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name2: string;
            }, {
                name2: string;
            }>;
        };
    };
};
//# sourceMappingURL=post.spec.d.ts.map