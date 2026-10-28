import { ZgokConfig, ZgokMethod } from "@zgok-api/zgok-core";
import express from "express";
import type { ZodError } from "zod";

export class ZgokRequestValidationError extends Error {
  readonly status = 400;
  constructor(
    public readonly namespace: string,
    public readonly key: string,
    /** 検証対象のリクエストボディ（GET/DELETE の場合はクエリ q の文字列） */
    public readonly body: any,
    /** ZodError。GET/DELETE のクエリ q が不正な JSON の場合は SyntaxError */
    public readonly error: ZodError | SyntaxError
  ) {
    super(`${namespace}/${key} request validation failed`);
    this.name = "ZgokRequestValidationError";
  }
}
export class ZgokResponseValidationError extends Error {
  readonly status = 500;
  constructor(
    public readonly namespace: string,
    public readonly key: string,
    /** 検証対象のレスポンスボディ */
    public readonly body: any,
    public readonly error: ZodError
  ) {
    super(`${namespace}/${key} response validation failed`);
    this.name = "ZgokResponseValidationError";
  }
}

// ミドルウェアを作成する
export function ZgokExpress<T extends ZgokConfig>(
  apiConfig: T
): {
  [N in keyof T]: {
    [K in keyof T[N]]: (
      callback: (
        req: express.Request & { zbody: ZgokMethod<T[N][K]>["req"] },
        res: express.Response
      ) => Promise<ZgokMethod<T[N][K]>["res"]>
    ) => (req: express.Request, res: express.Response, next: any) => void;
  };
} {
  const apiMethods: any = {};
  for (const namespace in apiConfig) {
    apiMethods[namespace] = {};
    for (const key in apiConfig[namespace]) {
      apiMethods[namespace][key] = (callback: any) => {
        return createMiddleware(apiConfig, namespace, key, callback);
      };
    }
  }
  return apiMethods;
}

function createMiddleware<T extends ZgokConfig>(
  apiConfig: T,
  namespace: string,
  key: string,
  callback: any
) {
  const config = apiConfig[namespace][key];
  const router = express.Router();
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
      return router.delete(
        path,
        execCallback(config, namespace, key, callback)
      );
    default:
      throw new Error(`Unsupported method: ${config.method}`);
  }
}

function execCallback(
  config: any,
  namespace: string,
  key: string,
  callback: any
) {
  return (req: any, res: express.Response, next: any) => {
    // req スキーマが無い API はボディ・クエリを見ない
    if (!config.req) {
      req.zbody = undefined;
      runCallback(config, namespace, key, callback, req, res, next);
      return;
    }
    let body: any;
    if (config.method == "get" || config.method == "delete") {
      // GET/DELETE はクエリ q に JSON 文字列でボディを受け取る
      const q = req.query.q;
      try {
        if (q === undefined) body = {};
        else if (typeof q !== "string")
          throw new SyntaxError("query parameter q must be a string");
        else body = JSON.parse(q);
      } catch (e) {
        next(new ZgokRequestValidationError(namespace, key, q, e as SyntaxError));
        return;
      }
    } else {
      body = req.body || {};
    }
    const parseResult = config.req.safeParse(body);
    if (!parseResult.success) {
      next(
        new ZgokRequestValidationError(namespace, key, body, parseResult.error)
      );
      return;
    }
    req.zbody = parseResult.data;
    runCallback(config, namespace, key, callback, req, res, next);
  };
}

function runCallback(
  config: any,
  namespace: string,
  key: string,
  callback: any,
  req: any,
  res: express.Response,
  next: any
) {
  // callback が同期的に throw しても catch(next) に乗せる
  Promise.resolve()
    .then(() => callback(req, res))
    .then((callbackRes: any) => {
      const parseResponse = config.res.safeParse(callbackRes);
      if (parseResponse.success) {
        res.send(parseResponse.data);
      } else {
        next(
          new ZgokResponseValidationError(
            namespace,
            key,
            callbackRes,
            parseResponse.error
          )
        );
      }
    })
    .catch(next);
}
