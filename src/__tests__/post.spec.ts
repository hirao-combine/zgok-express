import { z } from "zod";
import Express from "express";
const request = require("supertest");
import { postFunction } from "@zgok-api/zgok-core";
import { ZgokExpress } from "..";

export const SampleSchema = {
  dir1: {
    hoge1: postFunction({
      req: z.object({ id: z.number() }),
      res: z.object({ name1: z.string() }),
    }),
    err2: postFunction({
      req: z.object({ id: z.number() }),
      res: z.object({ name2: z.string() }),
    }),
  },
};
const ze = ZgokExpress(SampleSchema);

const app = Express();
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
const router = Express.Router();
router.use(
  // @ts-ignore
  ze.dir1.hoge1(async (req, res) => {
    return { name1: `name ${req.zbody.id}` };
  })
);
router.use(
  // @ts-ignore
  ze.dir1.err2(async (req, res) => {
    throw new Error("dir1.err2");
  })
);

app.use("/api", router);

//@ts-ignore
app.use((err: any, req: any, res: any, next: any) => {
  if (err.message === "dir1.err2") {
    res.status(500).json({ message: "dir1.err2 error" });
    return;
  }
  next(err);
});

describe("post method", () => {
  it("test1", async () => {
    const res = await request(app).post("/api/dir1/hoge1").send({ id: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name1: "name 1" });
  });
  it("test1 400", async () => {
    const res = await request(app).post("/api/dir1/hoge1").send({ id: "1" });
    console.log(res.status);
    expect(res.status).toBe(400);
  });
  it("err2", async () => {
    const res = await request(app).post("/api/dir1/err2").send({ id: 2 });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "dir1.err2 error" });
  });
});
