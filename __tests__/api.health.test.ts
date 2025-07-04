import handler from "../app/api/health/route";

describe("/api/health", () => {
  it("retourne status: ok", async () => {
    const req = {} as any;
    const res = { json: jest.fn() } as any;
    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith({ status: "ok" });
  });
});
