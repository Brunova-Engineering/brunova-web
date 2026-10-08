import { spawn } from "node:child_process"

import { chromium } from "@playwright/test"

const packageManagerCli = process.env.npm_execpath
const chromePath = process.env.CHROME_PATH ?? chromium.executablePath()

if (!packageManagerCli) {
  throw new Error("pnpm executable path is unavailable")
}

const child = spawn(
  process.execPath,
  [packageManagerCli, "exec", "lhci", "autorun", "--config=lighthouserc.cjs"],
  {
    env: { ...process.env, CHROME_PATH: chromePath },
    stdio: "inherit",
  },
)

child.on("error", (error) => {
  console.error(error)
  process.exitCode = 1
})

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Lighthouse CI stopped by ${signal}`)
    process.exitCode = 1
    return
  }

  process.exitCode = code ?? 1
})
