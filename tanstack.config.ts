import { defineConfig } from "@tanstack/router-plugin/config";

export default defineConfig({
  routesDirectory: "./src/routes",
  generatedRouteTree: "./src/routeTree.gen.ts",
});
