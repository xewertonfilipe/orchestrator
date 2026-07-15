import fs from "fs";
import path from "path";

describe("microfrontend-layout", () => {
  const filePath = path.join(__dirname, "microfrontend-layout.html");
  const layout = fs.readFileSync(filePath, "utf8");

  it("contains default and /home routes", () => {
    expect(layout).toContain("<route default>");
    expect(layout).toContain('<route path="/home" exact>');
  });

  it("contains all expected applications", () => {
    const applications = [
      "@bytebank/authentication",
      "@bytebank/navbar",
      "@bytebank/menu",
      "@bytebank/account",
      "@bytebank/transaction",
      "@bytebank/statement",
    ];

    applications.forEach((appName) => {
      expect(layout).toContain(`<application name="${appName}"></application>`);
    });
  });

  it("contains expected home wrappers for grid areas", () => {
    expect(layout).toContain('<div class="menu-slot">');
    expect(layout).toContain('<div class="aside">');
    expect(layout).toContain('<div class="statement-slot">');
  });

  it("keeps authentication only in default route", () => {
    const homeRouteMatch = layout.match(
      /<route path="\/home" exact>[\s\S]*?<\/route>/
    );

    expect(homeRouteMatch).toBeTruthy();
    expect(homeRouteMatch?.[0]).not.toContain("@bytebank/authentication");
  });
});
