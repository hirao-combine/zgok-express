import { z } from "zod";
import Express from "express";
const request = require("supertest");
import {
  deleteFunction,
  getFunction,
  patchFunction,
  postFunction,
  putFunction,
} from "@zgok-api/zgok-core";
import { ZgokExpress } from "..";

const req = z.object({ id: z.number() });
const res = z.object({ name: z.string() });
const schema = {
  m: {
    get1: getFunction({ req, res }),
    post1: postFunction({ req, res }),
    put1: putFunction({ req, res }),
    patch1: patchFunction({ req, res }),
    delete1: deleteFunction({ req, res }),
    strip: postFunction({ req, res }),
  },
};
const ze = ZgokExpress(schema);

const app = Express();
app.use(Express.json());
const router = Express.Router();
for (const key of ["get1", "post1", "put1", "patch1", "delete1"] as const) {
  router.use(
    ze.m[key](async (r) => {
      return { name: `${key} ${r.zbody.id}` };
    })
  );
}
router.use(
  ze.m.strip(async (r) => {
    // res スキーマに無いキーは parse で落ちる
    return { name: `strip ${r.zbody.id}`, extra: "dropped" } as any;
  })
);
app.use("/base", router);
app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(err.status ?? 500).json({ name: err.name });
});

const q = (data: unknown) => ({ q: JSON.stringify(data) });

describe("routing per method under a mount prefix", () => {
  it("GET reads body from ?q=", async () => {
    const r = await request(app).get("/base/m/get1").query(q({ id: 1 }));
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ name: "get1 1" });
  });
  it("POST reads JSON body", async () => {
    const r = await request(app).post("/base/m/post1").send({ id: 2 });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ name: "post1 2" });
  });
  it("PUT reads JSON body", async () => {
    const r = await request(app).put("/base/m/put1").send({ id: 3 });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ name: "put1 3" });
  });
  it("PATCH reads JSON body", async () => {
    const r = await request(app).patch("/base/m/patch1").send({ id: 4 });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ name: "patch1 4" });
  });
  it("DELETE reads body from ?q=", async () => {
    const r = await request(app).delete("/base/m/delete1").query(q({ id: 5 }));
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ name: "delete1 5" });
  });
  it("a route does not respond to another method", async () => {
    const r = await request(app).post("/base/m/get1").send({ id: 1 });
    expect(r.status).toBe(404);
  });
});

describe("request/response contract", () => {
  it("GET with q as an array is 400", async () => {
    const r = await request(app)
      .get("/base/m/get1")
      .query("q=%7B%22id%22%3A1%7D&q=%7B%22id%22%3A2%7D");
    expect(r.status).toBe(400);
    expect(r.body.name).toBe("ZgokRequestValidationError");
  });
  it("response is the parsed data (unknown keys stripped)", async () => {
    const r = await request(app).post("/base/m/strip").send({ id: 6 });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ name: "strip 6" });
  });
});
