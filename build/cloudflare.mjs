import { mkdirSync, writeFileSync } from "node:fs";
export function cloudflareOutput() {
  return {
    name: "cloudflare-static-output",
    closeBundle() {
      mkdirSync(".output/server", { recursive: true });
      const worker =
        "export default { fetch(request, env) { return env.ASSETS.fetch(request); } };";
      writeFileSync(".output/server/index.mjs", worker);
      writeFileSync(".output/public/_worker.js", worker);
      writeFileSync(
        ".output/server/wrangler.json",
        JSON.stringify({
          name: "jhf1009-crypto-companion-ai",
          main: "index.mjs",
          compatibility_date: "2026-10-09",
          assets: {
            directory: "../public",
            binding: "ASSETS",
            not_found_handling: "single-page-application",
          },
        }),
      );
      mkdirSync(".wrangler/deploy", { recursive: true });
      writeFileSync(
        ".wrangler/deploy/config.json",
        JSON.stringify({ configPath: "../../.output/server/wrangler.json" }),
      );
    },
  };
}
