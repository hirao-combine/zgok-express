import { z } from "zod";
import Express from "express";
const request = require("supertest");
import { getFunction, postFunction } from "@zgok-api/zgok-core";
import {
  ZgokExpress,
  ZgokRequestValidationError,
  ZgokResponseValidationError,
} from "..";

const schema = {
  dir1: {
    get1: getFunction({
      req: z.object({ id: z.number() }),
      res: z.object({ name: z.string() }),
    }),
    syncThrow: postFunction({
      req: z.object({ id: z.number() }),
      res: z.object({ name: z.string() }),
    }),
    badRes: postFunction({
      req: z.object({ id: z.number() }),
      res: z.object({ name: z.string() }),
    }),
  },
};
const ze = ZgokExpress(schema);

const app = Express();
app.use(Express.json());
app.use(
  ze.dir1.get1(async (req) => {
    return { name: `name ${req.zbody.id}` };
  })
);
app.use(
  ze.dir1.syncThrow((() => {
    throw new Error("sync throw");
  }) as any)
);
app.use(
  ze.dir1.badRes(async () => {
    return { name: 123 } as any;
  })
);
app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(err.status ?? 500).json({
    name: err.name,
    message: err.message,
    hasError: err.error !== undefined,
  });
});

describe("error handling", () => {
  it("GET with valid q", async () => {
    const res = await request(app)
      .get("/dir1/get1")
      .query({ q: JSON.stringify({ id: 1 }) });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: "name 1" });
  });
  it("GET with broken q is 400", async () => {
    const res = await request(app).get("/dir1/get1").query({ q: "{broken" });
    expect(res.status).toBe(400);
    expect(res.body.name).toBe("ZgokRequestValidationError");
    expect(res.body.hasError).toBe(true);
  });
  it("sync throw in callback reaches error handler", async () => {
    const res = await request(app).post("/dir1/syncThrow").send({ id: 1 });
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("sync throw");
  });
  it("invalid response is 500 with ZgokResponseValidationError", async () => {
    const res = await request(app).post("/dir1/badRes").send({ id: 1 });
    expect(res.status).toBe(500);
    expect(res.body.name).toBe("ZgokResponseValidationError");
    expect(res.body.message).toBe("dir1/badRes response validation failed");
  });
  it("error classes expose fields", () => {
    const err = new ZgokRequestValidationError("ns", "k", {}, new SyntaxError("x"));
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(400);
    expect(err.namespace).toBe("ns");
    expect(err.error.message).toBe("x");
    expect(new ZgokResponseValidationError("ns", "k", {}, {} as any).status).toBe(500);
  });
});
