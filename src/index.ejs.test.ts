import fs from "fs";
import path from "path";

describe("index.ejs template", () => {
  const filePath = path.join(__dirname, "index.ejs");
  const template = fs.readFileSync(filePath, "utf8");

  it("contains local and container-local conditional blocks", () => {
    expect(template).toContain("<% if (isLocal) { %>");
    expect(template).toContain("<% if (isContainerLocal) { %>");
    expect(template).toContain("<% if (isProduction) { %>");
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

  it("contains placeholders for production import map", () => {
    expect(template).toContain(
      '"@bytebank/account": "<%= productionImports.account %>"'
    );
    expect(template).toContain(
      '"@bytebank/authentication": "<%= productionImports.authentication %>"'
    );
    expect(template).toContain(
      '"@bytebank/menu": "<%= productionImports.menu %>"'
    );
    expect(template).toContain(
      '"@bytebank/navbar": "<%= productionImports.navbar %>"'
    );
    expect(template).toContain(
      '"@bytebank/root-config": "<%= productionImports.rootConfig %>"'
    );
    expect(template).toContain(
      '"@bytebank/statement": "<%= productionImports.statement %>"'
    );
    expect(template).toContain(
      '"@bytebank/transaction": "<%= productionImports.transaction %>"'
    );
  });
});
