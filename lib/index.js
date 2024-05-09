"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZgokExpress = exports.ZgokResponseValidationError = exports.ZgokRequestValidationError = void 0;
const express_1 = __importDefault(require("express"));
class ZgokRequestValidationError extends Error {
    constructor(
    // @ts-ignore
    namespace, 
    // @ts-ignore
    key, 
    // @ts-ignore
    body, 
    /** ZodError */
    // @ts-ignore
    error) {
        super();
        this.namespace = namespace;
        this.key = key;
        this.body = body;
        this.error = error;
        this.status = 400;
    }
}
exports.ZgokRequestValidationError = ZgokRequestValidationError;
class ZgokResponseValidationError extends Error {
    constructor(
    // @ts-ignore
    namespace, 
    // @ts-ignore
    key, 
    // @ts-ignore
    body, 
    /** ZodError */
    // @ts-ignore
    error) {
        super();
        this.namespace = namespace;
        this.key = key;
        this.body = body;
        this.error = error;
        this.status = 500;
    }
}
exports.ZgokResponseValidationError = ZgokResponseValidationError;
// ミドルウェアを作成する
function ZgokExpress(apiConfig) {
    const apiMethods = {};
    for (const namespace in apiConfig) {
        apiMethods[namespace] = {};
        for (const key in apiConfig[namespace]) {
            apiMethods[namespace][key] = (callback) => {
                return createMiddleware(apiConfig, namespace, key, callback);
            };
        }
    }
    return apiMethods;
}
exports.ZgokExpress = ZgokExpress;
function createMiddleware(apiConfig, namespace, key, callback) {
    const config = apiConfig[namespace][key];
    const router = express_1.default.Router();
    const path = `/${namespace}/${key}`;
    switch (config.method) {
        case "get":
            return router.get(path, execCallback(config, namespace, key, callback));
        case "post":
            return router.post(path, execCallback(config, namespace, key, callback));
        case "put":
            return router.put(path, execCallback(config, namespace, key, callback));
        case "patch":
            return router.patch(path, execCallback(config, namespace, key, callback));
        case "delete":
            return router.delete(path, execCallback(config, namespace, key, callback));
        default:
            throw new Error(`Unsupported method: ${config.method}`);
    }
}
function execCallback(config, namespace, key, callback) {
    return (req, res, next) => {
        const body = config.method == "get" || config.method == "delete"
            ? JSON.parse(req.query.q || "{}")
            : req.body || {};
        const parseResult = config.req.safeParse(body);
        if (!parseResult.success) {
            next(new ZgokRequestValidationError(namespace, key, body, parseResult.error));
            return;
        }
        req.zbody = parseResult.data;
        callback(req, res)
            .then((callbackRes) => {
            const parseResponse = config.res.safeParse(callbackRes);
            if (parseResponse.success) {
                res.send(callbackRes);
            }
            else {
                next(new ZgokResponseValidationError(namespace, key, callbackRes, parseResponse.error));
            }
        })
            .catch(next);
    };
}
