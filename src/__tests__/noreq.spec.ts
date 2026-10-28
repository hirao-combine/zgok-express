import { z } from "zod";
import Express from "express";
const request = require("supertest");
import { getFunction, postFunction } from "@zgok-api/zgok-core";
import { ZgokExpress } from "..";

const schema = {
  dir1: {
    getNoReq: getFunction({
      res: z.object({ name: z.string() }),
    }),
    postNoReq: postFunction({
      res: z.object({ name: z.string() }),
    }),
  },
};
const ze = ZgokExpress(schema);

const app = Express();
app.use(Express.json());
app.use(
  ze.dir1.getNoReq(async (req) => {
    // 型レベル: zbody は undefined
    const zbody: undefined = req.zbody;
    return { name: `get ${zbody}` };
  })
);
app.use(
  ze.dir1.postNoReq(async (req) => {
    return { name: `post ${req.zbody}` };
  })
);

describe("schema without req", () => {
  it("GET without query", async () => {
    const res = await request(app).get("/dir1/getNoReq");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: "get undefined" });
  });
  it("GET ignores a broken q", async () => {
    const res = await request(app).get("/dir1/getNoReq").query({ q: "{broken" });
    expect(res.status).toBe(200);
  });
  it("POST without body", async () => {
    const res = await request(app).post("/dir1/postNoReq");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: "post undefined" });
  });
});
