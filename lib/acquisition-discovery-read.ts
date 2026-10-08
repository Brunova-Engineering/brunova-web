import { acquisitionApi } from "./acquisition-api"

type Snapshot = Awaited<ReturnType<typeof acquisitionApi.discovery>>
let cached: { until: number; result: Promise<Snapshot> } | null = null

/** Share one large read across adjacent Portal tabs; explicit refresh invalidates it. */
export function readDiscovery() {
  if (process.env.NODE_ENV === "test") return acquisitionApi.discovery()
  if (cached && cached.until > Date.now()) return cached.result
  const result = acquisitionApi.discovery()
  cached = { until: Date.now() + 30_000, result }
  void result.catch(() => {
    if (cached?.result === result) cached = null
  })
  return result
}

export function invalidateDiscoveryRead() {
  cached = null
}
