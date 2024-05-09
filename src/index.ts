import { ZgokConfig, ZgokMethod } from "@zgok-api/zgok-core";
import express from "express";

export class ZgokRequestValidationError extends Error {
  constructor(
    // @ts-ignore
    private namespace: string,
    // @ts-ignore
    private key: string,
    // @ts-ignore
    private body: any,
    /** ZodError */
    // @ts-ignore
    private error: Error
  ) {
    super();
  }
  status = 400;
}
export class ZgokResponseValidationError extends Error {
  constructor(
    // @ts-ignore
    private namespace: string,
    // @ts-ignore
    private key: string,
    // @ts-ignore
    private body: any,
    /** ZodError */
    // @ts-ignore
    private error: Error
  ) {
    super();
  }
  status = 500;
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
    const body =
      config.method == "get" || config.method == "delete"
        ? JSON.parse(req.query.q || "{}")
        : req.body || {};
    const parseResult = config.req.safeParse(body);
    if (!parseResult.success) {
      next(
        new ZgokRequestValidationError(namespace, key, body, parseResult.error)
      );
      return;
    }
    req.zbody = parseResult.data;
    callback(req, res)
      .then((callbackRes: any) => {
        const parseResponse = config.res.safeParse(callbackRes);
        if (parseResponse.success) {
          res.send(callbackRes);
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
  };
}
