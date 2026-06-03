import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function syncOpenApi() {
  const currentFilePath = fileURLToPath(import.meta.url);
  const scriptsDirectoryPath = path.dirname(currentFilePath);
  const repositoryRootPath = path.resolve(scriptsDirectoryPath, "..");
  const targetOpenApiPath = path.join(repositoryRootPath, "functions", "openapi.json");

  const spec = JSON.parse(await readFile(targetOpenApiPath, "utf8"));
  const formatted = `${JSON.stringify(spec, null, 2)}\n`;

  await writeFile(targetOpenApiPath, formatted);
}

await syncOpenApi();
