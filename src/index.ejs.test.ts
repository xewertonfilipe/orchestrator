import fs from "fs";
import path from "path";

describe("index.ejs template", () => {
  const filePath = path.join(__dirname, "index.ejs");
  const template = fs.readFileSync(filePath, "utf8");

  it("contains local and container-local conditional blocks", () => {
    expect(template).toContain("<% if (isLocal) { %>");
    expect(template).toContain("<% if (isContainerLocal) { %>");
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

  it("contains expected MFE endpoints for container-local environment", () => {
    expect(template).toContain("http://localhost:8085/bytebank-transaction.js");
    expect(template).toContain("http://localhost:8084/bytebank-statement.js");
    expect(template).toContain(
      "http://localhost:8087/bytebank-authentication.js"
    );
  });
});
