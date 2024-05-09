"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SampleSchema = void 0;
const zod_1 = require("zod");
const express_1 = __importDefault(require("express"));
const request = require("supertest");
const zgok_core_1 = require("@zgok-api/zgok-core");
const __1 = require("..");
exports.SampleSchema = {
    dir1: {
        hoge1: (0, zgok_core_1.postFunction)({
            req: zod_1.z.object({ id: zod_1.z.number() }),
            res: zod_1.z.object({ name1: zod_1.z.string() }),
        }),
        err2: (0, zgok_core_1.postFunction)({
            req: zod_1.z.object({ id: zod_1.z.number() }),
            res: zod_1.z.object({ name2: zod_1.z.string() }),
        }),
    },
};
const ze = (0, __1.ZgokExpress)(exports.SampleSchema);
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const router = express_1.default.Router();
router.use(
// @ts-ignore
ze.dir1.hoge1((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return { name1: `name ${req.zbody.id}` };
})));
router.use(
// @ts-ignore
ze.dir1.err2((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    throw new Error("dir1.err2");
})));
app.use("/api", router);
//@ts-ignore
app.use((err, req, res, next) => {
    if (err.message === "dir1.err2") {
        res.status(500).json({ message: "dir1.err2 error" });
        return;
    }
    next(err);
});
describe("post method", () => {
    it("test1", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield request(app).post("/api/dir1/hoge1").send({ id: 1 });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ name1: "name 1" });
    }));
    it("test1 400", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield request(app).post("/api/dir1/hoge1").send({ id: "1" });
        console.log(res.status);
        expect(res.status).toBe(400);
    }));
    it("err2", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield request(app).post("/api/dir1/err2").send({ id: 2 });
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ message: "dir1.err2 error" });
    }));
});
