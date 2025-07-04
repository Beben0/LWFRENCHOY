import { formatDate } from "../lib/utils";

describe("formatDate", () => {
  it("formate une date ISO en JJ/MM/AAAA", () => {
    expect(formatDate("2024-07-04T12:00:00Z")).toBe("04/07/2024");
  });
});
