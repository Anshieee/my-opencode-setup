import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const DEFAULT_MODEL_IDS = new Set([
  'opencode-go/muse-spark-1.3-contributor',
  'opencode-go/deepseek-v4.1-flash',
])

export function parseModelRef(value) {
  if (typeof value !== 'string') return undefined
  const providerEnd = value.indexOf('/')
  if (providerEnd <= 0) return undefined
  const variantStart = value.indexOf('#', providerEnd + 1)
  const providerID = value.slice(0, providerEnd)
  const modelID = value.slice(providerEnd + 1, variantStart === -1 ? undefined : variantStart)
  const variant = variantStart === -1 ? undefined : value.slice(variantStart + 1)
  if (!modelID || providerID.includes('#') || (variant !== undefined && (!variant || variant.includes('#')))) return undefined
  return { providerID, modelID, ...(variant ? { variant } : {}) }
}

export const PRESETS = Object.freeze({
  focused: ['correctness', 'architecture', 'jester'],
  app: ['correctness', 'product', 'security', 'jester'],
  full: ['correctness', 'architecture', 'product', 'security', 'reliability', 'performance', 'jester'],
})

export const DEFAULTS = Object.freeze({
  version: 2,
  maxConcurrent: 2,
  defaultPreset: 'focused',
  roles: {
    correctness: {
      label: 'Correctness',
      model: 'opencode-go/muse-spark-1.3-contributor',
      mandate: 'Check required behavior, edge cases, regressions, and whether evidence supports each criterion. Do not grade style or invent requirements.',
    },
    architecture: {
      label: 'Architecture',
      model: 'opencode-go/deepseek-v4.1-flash',
      mandate: 'Check boundaries, dependency direction, state ownership, and whether the design fits the stated constraints. Avoid restating correctness findings unless the architecture creates them.',
    },
    product: {
      label: 'Product and UX',
      model: 'opencode-go/muse-spark-1.3-contributor',
      mandate: 'Check whether the result serves the stated user workflow, communicates clearly, and preserves meaningful user control. Do not review internals unless they affect the workflow.',
    },
    security: {
      label: 'Security',
      model: 'opencode-go/deepseek-v4.1-flash',
      mandate: 'Look for concrete trust-boundary, permission, injection, secret, and data-handling risks. Explain plausible impact and evidence; do not offer generic hardening lists.',
    },
    reliability: {
      label: 'Reliability',
      model: 'opencode-go/muse-spark-1.3-contributor',
      mandate: 'Check failure handling, cancellation, recovery, idempotence, and state consistency under the declared operating conditions. Do not speculate beyond supplied evidence.',
    },
    performance: {
      label: 'Performance',
      model: 'opencode-go/deepseek-v4.1-flash',
      mandate: 'Assess latency, memory, throughput, and scaling only against stated constraints and supplied measurements. Separate measured findings from hypotheses.',
    },
    jester: {
      label: 'Jester / meta-skeptic',
      model: 'opencode-go/muse-spark-1.3-contributor',
      mandate: 'Challenge hidden assumptions, rubric gaming, and confusing progress with success. Give only falsifiable counterexamples or checks that are in scope and grounded in the supplied contract/evidence. Do not use humor, invent requirements, or add out-of-scope blockers.',
    },
  },
  presets: PRESETS,
})

function fail(message) { throw new Error(`Council config invalid: ${message}`) }

export function validateConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('expected an object')
  if (value.version !== 2) fail('version must be 2')
  if (!Number.isInteger(value.maxConcurrent) || value.maxConcurrent < 1 || value.maxConcurrent > 2) fail('maxConcurrent must be 1 or 2')
  if (typeof value.defaultPreset !== 'string' || !Object.hasOwn(value.presets || {}, value.defaultPreset)) fail('defaultPreset must name a configured preset')
  if (!value.roles || typeof value.roles !== 'object' || Array.isArray(value.roles)) fail('roles must be an object')
  for (const [id, role] of Object.entries(value.roles)) {
    if (!/^[a-z][a-z0-9-]*$/.test(id) || !role || typeof role !== 'object' || typeof role.label !== 'string' || !role.label.trim() || typeof role.mandate !== 'string' || !role.mandate.trim()) fail(`invalid role definition: ${id}`)
    if (!parseModelRef(role.model)) fail(`role ${id} has invalid provider/model[#variant] reference: ${String(role.model)}`)
  }
  if (!value.presets || typeof value.presets !== 'object' || Array.isArray(value.presets)) fail('presets must be an object')
  for (const [name, ids] of Object.entries(value.presets)) {
    if (!['focused', 'app', 'full'].includes(name) || !Array.isArray(ids) || !ids.length) fail(`invalid preset: ${name}`)
    const seen = new Set()
    for (const id of ids) {
      if (typeof id !== 'string' || !Object.hasOwn(value.roles, id) || seen.has(id)) fail(`preset ${name} has unknown or duplicate role ${String(id)}`)
      seen.add(id)
    }
  }
  for (const name of ['focused', 'app', 'full']) if (!Object.hasOwn(value.presets, name)) fail(`missing preset: ${name}`)
  return value
}

function merge(base, override) {
  const roles = { ...base.roles }
  for (const [id, role] of Object.entries(override.roles || {})) {
    roles[id] = role && typeof role === 'object' && !Array.isArray(role)
      ? { ...(base.roles[id] || {}), ...role }
      : role
  }
  return {
    ...base,
    ...override,
    roles,
    presets: { ...base.presets, ...(override.presets || {}) },
  }
}

export async function loadConfig(workspaceRoot, options = {}) {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url))
  const globalFile = options.configFile || path.resolve(moduleDir, '../../council.json')
  let config = structuredClone(DEFAULTS)
  try { config = merge(config, JSON.parse(await fs.readFile(globalFile, 'utf8'))) }
  catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Cannot load ${globalFile}: ${error.message}`)
  }
  const workspaceFile = path.join(workspaceRoot, '.opencode', 'council.json')
  try { config = merge(config, JSON.parse(await fs.readFile(workspaceFile, 'utf8'))) }
  catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Cannot load ${workspaceFile}: ${error.message}`)
  }
  return validateConfig(config)
}

export function selectPanel(config, preset = config.defaultPreset) {
  if (typeof preset !== 'string' || !Object.hasOwn(config.presets, preset)) throw new Error(`Unknown council preset: ${String(preset)}`)
  return {
    preset,
    maxConcurrent: config.maxConcurrent,
    members: config.presets[preset].map(id => ({ id, ...structuredClone(config.roles[id]) })),
  }
}
