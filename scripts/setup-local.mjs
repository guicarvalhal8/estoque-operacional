import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const envOnly = process.argv.includes("--env-only");

const backendEnvPath = resolve(root, "backend", ".env");
const backendEnvExamplePath = resolve(root, "backend", ".env.example");
const frontendEnvPath = resolve(root, "frontend", ".env.local");
const frontendEnvExamplePath = resolve(root, "frontend", ".env.example");

function ensureFileFromExample(targetPath, examplePath) {
  mkdirSync(dirname(targetPath), { recursive: true });

  if (!existsSync(targetPath)) {
    copyFileSync(examplePath, targetPath);
  }
}

ensureFileFromExample(backendEnvPath, backendEnvExamplePath);
ensureFileFromExample(frontendEnvPath, frontendEnvExamplePath);

const frontendEnv = readFileSync(frontendEnvPath, "utf8");
if (!frontendEnv.includes("NEXT_PUBLIC_API_URL")) {
  writeFileSync(frontendEnvPath, 'NEXT_PUBLIC_API_URL="http://localhost:4000"\n', "utf8");
}

execSync("npm run prisma:generate --workspace backend", {
  stdio: "inherit",
  cwd: root
});

if (envOnly) {
  console.log("\nArquivos .env preparados. Preencha o PostgreSQL e rode npm run db:push.");
  process.exit(0);
}

const backendEnv = readFileSync(backendEnvPath, "utf8");
const hasPlaceholderDatabase =
  backendEnv.includes("seu-projeto.supabase.co") || backendEnv.includes("troque-sua-senha");

if (hasPlaceholderDatabase) {
  console.log("\nOs arquivos .env foram preparados.");
  console.log("Preencha DATABASE_URL e DIRECT_URL em backend/.env e depois rode:");
  console.log("npm run db:push");
  console.log("npm run seed");
  process.exit(0);
}

execSync("npm run prisma:push --workspace backend", {
  stdio: "inherit",
  cwd: root
});

execSync("npm run seed --workspace backend", {
  stdio: "inherit",
  cwd: root
});

console.log("\nAmbiente pronto com PostgreSQL.");
