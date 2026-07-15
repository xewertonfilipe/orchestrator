import fs from "fs";
import path from "path";

describe("index.ejs template", () => {
  const filePath = path.join(__dirname, "index.ejs");
  const template = fs.readFileSync(filePath, "utf8");

  it("contains local conditional block", () => {
    expect(template).toContain("<% if (isLocal) { %>");
    expect(template).not.toContain("isContainerLocal");
  });

  it("contains shared dependency import map", () => {
    expect(template).toContain('"single-spa"');
    expect(template).toContain('"react"');
    expect(template).toContain('"react-dom"');
  });

  it("contains expected MFE endpoints for local environment", () => {
    expect(template).toContain("http://localhost:9006/bytebank-transaction.js");
    expect(template).toContain("http://localhost:9005/bytebank-statement.js");
  });
});
