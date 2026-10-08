import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import { gzipSync } from "node:zlib"

const baseUrl = process.env.BUNDLE_BASE_URL ?? "http://127.0.0.1:3000"
const reportPath = process.env.BUNDLE_REPORT_PATH
const routes = [
  "/",
  "/capabilities",
  "/process",
  "/work",
  "/work/document-intelligence-workflow",
  "/about",
  "/contact",
  "/privacy",
  "/portal",
  "/es",
  "/es/capabilities",
  "/es/contact",
  "/es/work/document-intelligence-workflow",
]

const budgets = {
  firstLoadJavaScriptGzip: 130 * 1024,
  routeSpecificJavaScriptGzip: 30 * 1024,
  cssGzip: 35 * 1024,
  initialFonts: 160 * 1024,
}
const warningOnlyBudgets = new Set(["firstLoadJavaScriptGzip"])

function assetsFromHtml(html) {
  const assets = new Set()
  const matcher = /(?:href|src)="([^"?]+\.(?:css|js|woff2))(?:\?[^"}]*)?"/g

  for (const match of html.matchAll(matcher)) {
    if (match[1]?.startsWith("/_next/static/")) assets.add(match[1])
  }

  return assets
}

async function compressedAssetSize(assetPath) {
  const localPath = `.next/${assetPath.replace("/_next/", "")}`
  const bytes = await readFile(localPath)
  return gzipSync(bytes, { level: 9 }).byteLength
}

async function inspectRoute(route) {
  const response = await fetch(new URL(route, baseUrl))
  if (!response.ok) throw new Error(`${route} returned ${response.status}`)

  const html = await response.text()
  const assets = assetsFromHtml(html)
  const measured = await Promise.all(
    [...assets].map(async (asset) => ({
      asset,
      gzipBytes: await compressedAssetSize(asset),
    })),
  )

  return {
    route,
    assets: measured,
    scripts: new Set(
      measured
        .filter(({ asset }) => asset.endsWith(".js"))
        .map(({ asset }) => asset),
    ),
  }
}

const inspectedRoutes = await Promise.all(routes.map(inspectRoute))
const sharedScripts = inspectedRoutes
  .map(({ scripts }) => scripts)
  .reduce((shared, routeScripts) => {
    return new Set([...shared].filter((asset) => routeScripts.has(asset)))
  })

const assetSizes = new Map(
  inspectedRoutes.flatMap(({ assets }) =>
    assets.map(({ asset, gzipBytes }) => [asset, gzipBytes]),
  ),
)

const sumAssets = (assets) =>
  assets.reduce((total, asset) => total + (assetSizes.get(asset) ?? 0), 0)

const routeReports = inspectedRoutes.map(({ assets, route, scripts }) => {
  const css = assets
    .filter(({ asset }) => asset.endsWith(".css"))
    .map(({ asset }) => asset)
  const fonts = assets
    .filter(({ asset }) => asset.endsWith(".woff2"))
    .map(({ asset }) => asset)
  const routeSpecificScripts = [...scripts].filter(
    (asset) => !sharedScripts.has(asset),
  )

  return {
    route,
    firstLoadJavaScriptGzip: sumAssets([...scripts]),
    routeSpecificJavaScriptGzip: sumAssets(routeSpecificScripts),
    cssGzip: sumAssets(css),
    initialFonts: sumAssets(fonts),
    budgetPass: {
      firstLoadJavaScriptGzip:
        sumAssets([...scripts]) <= budgets.firstLoadJavaScriptGzip,
      routeSpecificJavaScriptGzip:
        sumAssets(routeSpecificScripts) <= budgets.routeSpecificJavaScriptGzip,
      cssGzip: sumAssets(css) <= budgets.cssGzip,
      initialFonts: sumAssets(fonts) <= budgets.initialFonts,
    },
  }
})

const largestClientAssets = [...assetSizes]
  .filter(([asset]) => asset.endsWith(".js"))
  .sort((left, right) => right[1] - left[1])
  .slice(0, 10)
  .map(([asset, gzipBytes]) => ({ asset, gzipBytes }))

const report = {
  measuredAt: new Date().toISOString(),
  baseUrl,
  budgets,
  sharedJavaScriptGzip: sumAssets([...sharedScripts]),
  routes: routeReports,
  largestClientAssets,
}

console.log(JSON.stringify(report, null, 2))

if (reportPath) {
  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
}

const strictFailures = routeReports.flatMap(({ budgetPass, route }) =>
  Object.entries(budgetPass)
    .filter(([budget, passed]) => !passed && !warningOnlyBudgets.has(budget))
    .map(([budget]) => `${route}: ${budget}`),
)
const warningFailures = routeReports.flatMap(({ budgetPass, route }) =>
  Object.entries(budgetPass)
    .filter(([budget, passed]) => !passed && warningOnlyBudgets.has(budget))
    .map(([budget]) => `${route}: ${budget}`),
)

if (warningFailures.length > 0) {
  console.warn(
    `Warning-only bundle targets exceeded:\n${warningFailures.join("\n")}`,
  )
}

if (strictFailures.length > 0) {
  console.error(
    `Enforced bundle budgets exceeded:\n${strictFailures.join("\n")}`,
  )
  process.exitCode = 1
}
