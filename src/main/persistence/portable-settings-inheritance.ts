import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { GlobalSettings } from '../../shared/global-settings-types'
import type { PersistedState } from '../../shared/persisted-state-types'
import { writeDurableSecureJsonFile } from '../../shared/secure-file'
import { readProfileIndex } from '../orca-profiles/profile-index-store'
import {
  getOrcaProfileDataFile,
  getOrcaProfileIndexPath,
  legacyDataFilePath
} from '../orca-profiles/profile-storage-paths'
import {
  mergePortableSettingsProjections,
  portableProjectionHasValues,
  projectPortableSettings,
  projectPortableSettingsUpdate,
  projectPortableUIUpdate,
  type PortableSettingsProjection
} from './portable-settings-projection'

export const PORTABLE_SETTINGS_OVERRIDE_FILE = 'orca-dev-portable-overrides.json'
export const PORTABLE_SETTINGS_OVERRIDE_VERSION = 1

type PortableSettingsOverrideFile = PortableSettingsProjection & {
  version: typeof PORTABLE_SETTINGS_OVERRIDE_VERSION
}

function areSamePath(left: string, right: string): boolean {
  const normalize = (value: string): string => {
    const resolved = resolve(value)
    try {
      return realpathSync(resolved)
    } catch {
      return resolved
    }
  }
  const normalizedLeft = normalize(left)
  const normalizedRight = normalize(right)
  return process.platform === 'win32'
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight
}

function resolveStableDataFile(stableUserDataPath: string): string | null {
  const indexPath = getOrcaProfileIndexPath(stableUserDataPath)
  if (existsSync(indexPath)) {
    const index = readProfileIndex(indexPath)
    if (!index) {
      return null
    }
    const dataFile = getOrcaProfileDataFile(index.activeProfileId, stableUserDataPath)
    return existsSync(dataFile) ? dataFile : null
  }
  const legacyDataFile = legacyDataFilePath(stableUserDataPath)
  return existsSync(legacyDataFile) ? legacyDataFile : null
}

function readProjectionFile(dataFile: string): PortableSettingsProjection | null {
  try {
    return projectPortableSettings(JSON.parse(readFileSync(dataFile, 'utf-8')))
  } catch {
    return null
  }
}

function readOverrides(path: string): {
  valid: boolean
  initialized: boolean
  projection: PortableSettingsProjection
} {
  const empty = { settings: {}, ui: {} }
  if (!existsSync(path)) {
    return { valid: true, initialized: false, projection: empty }
  }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>
    if (
      raw.version !== PORTABLE_SETTINGS_OVERRIDE_VERSION ||
      !raw.settings ||
      typeof raw.settings !== 'object' ||
      Array.isArray(raw.settings) ||
      !raw.ui ||
      typeof raw.ui !== 'object' ||
      Array.isArray(raw.ui)
    ) {
      return { valid: false, initialized: true, projection: empty }
    }
    return { valid: true, initialized: true, projection: projectPortableSettings(raw) }
  } catch {
    return { valid: false, initialized: true, projection: empty }
  }
}

export class PortableSettingsInheritance {
  private readonly overrideFilePath: string
  private readonly stableUserDataPath: string
  private readonly dataFile: string
  private localOverrides: PortableSettingsProjection
  private overridesValid: boolean
  private overridesInitialized: boolean

  constructor(options: { dataFile: string; stableUserDataPath: string }) {
    this.dataFile = options.dataFile
    this.stableUserDataPath = options.stableUserDataPath
    this.overrideFilePath = join(dirname(options.dataFile), PORTABLE_SETTINGS_OVERRIDE_FILE)
    const overrides = readOverrides(this.overrideFilePath)
    this.localOverrides = overrides.projection
    this.overridesValid = overrides.valid
    this.overridesInitialized = overrides.initialized
    if (!this.overridesValid) {
      console.warn('[persistence] Ignoring malformed dev portable settings overrides')
    }
  }

  apply(state: PersistedState): boolean {
    if (!this.overridesValid) {
      return false
    }
    let projection = this.localOverrides
    const stableDataFile = resolveStableDataFile(this.stableUserDataPath)
    if (stableDataFile && !areSamePath(stableDataFile, this.dataFile)) {
      const stableProjection = readProjectionFile(stableDataFile)
      if (stableProjection && portableProjectionHasValues(stableProjection)) {
        projection = mergePortableSettingsProjections(stableProjection, projection)
        if (!this.overridesInitialized) {
          this.overridesInitialized = true
          this.writeOverrides()
        }
      }
    }
    return this.applyProjectionToState(state, projection)
  }

  recordSettingsUpdate(updates: Partial<GlobalSettings>): void {
    this.record({ settings: projectPortableSettingsUpdate(updates), ui: {} })
  }

  recordUIUpdate(updates: Partial<PersistedState['ui']>): void {
    this.record({ settings: {}, ui: projectPortableUIUpdate(updates) })
  }

  private record(update: PortableSettingsProjection): void {
    if (!this.overridesValid || !portableProjectionHasValues(update)) {
      return
    }
    this.localOverrides = mergePortableSettingsProjections(this.localOverrides, update)
    this.overridesInitialized = true
    this.writeOverrides()
  }

  private writeOverrides(): void {
    try {
      const file: PortableSettingsOverrideFile = {
        version: PORTABLE_SETTINGS_OVERRIDE_VERSION,
        settings: this.localOverrides.settings,
        ui: this.localOverrides.ui
      }
      writeDurableSecureJsonFile(this.overrideFilePath, file)
    } catch (error) {
      console.warn(
        '[persistence] Failed to persist dev portable settings overrides:',
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  private applyProjectionToState(
    state: PersistedState,
    projection: PortableSettingsProjection
  ): boolean {
    let changed = false
    const apply = (target: Record<string, unknown>, values: Record<string, unknown>): void => {
      for (const [key, value] of Object.entries(values)) {
        const current = target[key]
        const isObject = (entry: unknown): entry is Record<string, unknown> =>
          typeof entry === 'object' && entry !== null && !Array.isArray(entry)
        const next = isObject(current) && isObject(value) ? { ...current, ...value } : value
        if (JSON.stringify(current) !== JSON.stringify(next)) {
          target[key] = next
          changed = true
        }
      }
    }
    apply(state.settings as unknown as Record<string, unknown>, projection.settings)
    apply(state.ui as unknown as Record<string, unknown>, projection.ui)
    return changed
  }
}
