import { ZgokConfig, ZgokMethod } from "@zgok-api/zgok-core";
import express from "express";
export declare class ZgokRequestValidationError extends Error {
    private namespace;
    private key;
    private body;
    /** ZodError */
    private error;
    constructor(namespace: string, key: string, body: any, 
    /** ZodError */
    error: Error);
    status: number;
}
export declare class ZgokResponseValidationError extends Error {
    private namespace;
    private key;
    private body;
    /** ZodError */
    private error;
    constructor(namespace: string, key: string, body: any, 
    /** ZodError */
    error: Error);
    status: number;
}
export declare function ZgokExpress<T extends ZgokConfig>(apiConfig: T): {
    [N in keyof T]: {
        [K in keyof T[N]]: (callback: (req: express.Request & {
            zbody: ZgokMethod<T[N][K]>["req"];
        }, res: express.Response) => Promise<ZgokMethod<T[N][K]>["res"]>) => (req: express.Request, res: express.Response, next: any) => void;
    };
};
//# sourceMappingURL=index.d.ts.map