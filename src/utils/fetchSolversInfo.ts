import * as Sentry from '@sentry/browser'

export type SolverInfo = {
  address: string
  name: string
  environment: string
}

export type SolversInfo = SolverInfo[]

const SOLVER_SOURCE_PER_NETWORK: Record<number, string> = {
  1: 'https://raw.githubusercontent.com/duneanalytics/spellbook/main/models/cow_protocol/ethereum/cow_protocol_ethereum_solvers.sql',
  100: 'https://raw.githubusercontent.com/duneanalytics/spellbook/main/deprecated-dune-v1-abstractions/xdai/gnosis_protocol_v2/view_solvers.sql',
  5: 'https://this-doesnt-exist.intentionally',
}

/**
 * This is a very dirty temporary solution to get the solver info dynamically
 *
 * The source file is a SQL with the structure that we care about looking like:
 * FROM (VALUES ('0xf2d21ad3c88170d4ae52bbbeba80cb6078d276f4', 'prod', 'MIP'),
 *              ('0x15f4c337122ec23859ec73bec00ab38445e45304', 'prod', 'Gnosis_ParaSwap'),
 * The regex below extracts the 3 fields we are looking for and ignore the rest
 */
const REGEX = /\('(0x[0-9a-fA-F]{40})',\s*'(\w+)',\s*'([\w\s]+)'\)/g

const SOLVERS_INFO_CACHE: Record<number, SolversInfo> = {}

const SENTRY_TAGS = { errorType: 'solverInfo' }

export async function fetchSolversInfo(network: number): Promise<SolversInfo> {
  const url = SOLVER_SOURCE_PER_NETWORK[network]

  if (!url) {
    return []
  }

  const cache = SOLVERS_INFO_CACHE[network]
  if (cache) {
    return cache
  }

  try {
    const response = await fetch(url)

    const result = response.ok ? _parseSolverInfo(await response.text()) : []

    if (!result?.length) {
      console.error('[fetchSolverInfo] No results parsed')
      Sentry.captureException(
        `Parsing of solver info for network ${network} returned no results. Source file '${url}' might have changed`,
        {
          tags: SENTRY_TAGS,
          contexts: { params: { network, url } },
        },
      )
    }

    SOLVERS_INFO_CACHE[network] = result

    return result
  } catch (error) {
    console.error(`[fetchSolverInfo] Failed to fetch solvers info from '${url}'`)

    Sentry.captureException(`Fetching of solver info for network ${network} failed. Error: ${error.message}`, {
      tags: SENTRY_TAGS,
      contexts: { params: { network, url } },
      extra: { error },
    })

    return []
  }
}

function _parseSolverInfo(body: string): SolversInfo {
  const info: SolversInfo = []

  const matches = body.matchAll(REGEX)

  // Each match has 4 entries:
  // 1. The whole capture group
  // 2. The address
  // 3. The environment
  // 4. The name
  for (const [, address, environment, name] of matches) {
    info.push({ address, environment, name })
  }

  return info
}
