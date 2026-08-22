import type { GlobalSettings } from '../../shared/global-settings-types'
import type { PersistedState } from '../../shared/persisted-state-types'
import {
  PORTABLE_BOOLEAN_SETTING_KEYS,
  PORTABLE_BOOLEAN_UI_KEYS,
  PORTABLE_COMPLEX_SETTING_KEYS,
  PORTABLE_COMPLEX_UI_KEYS,
  PORTABLE_NULLABLE_STRING_SETTING_KEYS,
  PORTABLE_NUMBER_SETTING_KEYS,
  PORTABLE_NUMBER_UI_KEYS,
  PORTABLE_STRING_ARRAY_SETTING_KEYS,
  PORTABLE_STRING_SETTING_KEYS,
  PORTABLE_STRING_UI_KEYS,
  SAFE_NOTIFICATION_SOUND_IDS,
  SAFE_SETTING_STRING_VALUES
} from './portable-settings-allowlist'
import {
  cloneBoundedJson,
  copySafeNumber,
  copySafeString,
  copySafeStringArray,
  copySafeStringRecord,
  isRecord,
  isSafeObjectKey,
  type PortableValueMap
} from './portable-settings-value-validation'

export type PortableSettingsProjection = {
  settings: PortableValueMap
  ui: PortableValueMap
}

function projectNotifications(value: unknown): PortableValueMap | undefined {
  if (!isRecord(value)) {
    return undefined
  }
  const result: PortableValueMap = {}
  for (const key of ['enabled', 'agentTaskComplete', 'terminalBell', 'suppressWhenFocused']) {
    if (typeof value[key] === 'boolean') {
      result[key] = value[key]
    }
  }
  if (
    typeof value.customSoundId === 'string' &&
    SAFE_NOTIFICATION_SOUND_IDS.has(value.customSoundId)
  ) {
    result.customSoundId = value.customSoundId
  }
  if (
    value.customSoundPath === null ||
    (typeof value.customSoundPath === 'string' && value.customSoundPath.length <= 8192)
  ) {
    result.customSoundPath = value.customSoundPath
  }
  const volume = copySafeNumber(value.customSoundVolume)
  if (volume !== undefined) {
    result.customSoundVolume = volume
  }
  return Object.keys(result).length > 0 ? result : undefined
}

function projectCommitMessageAi(value: unknown): PortableValueMap | undefined {
  if (!isRecord(value)) {
    return undefined
  }
  const result: PortableValueMap = {}
  if (typeof value.enabled === 'boolean') {
    result.enabled = value.enabled
  }
  if (value.agentId === null || typeof value.agentId === 'string') {
    result.agentId = value.agentId
  }
  const models = copySafeStringRecord(value.selectedModelByAgent, 512)
  if (models) {
    result.selectedModelByAgent = models
  }
  const thinking = copySafeStringRecord(value.selectedThinkingByModel, 256)
  if (thinking) {
    result.selectedThinkingByModel = thinking
  }
  const prompt = copySafeString(value.customPrompt)
  if (prompt !== undefined) {
    result.customPrompt = prompt
  }
  return Object.keys(result).length > 0 ? result : undefined
}

function projectSourceControlAi(value: unknown): PortableValueMap | undefined {
  if (!isRecord(value)) {
    return undefined
  }
  const result: PortableValueMap = {}
  if (typeof value.enabled === 'boolean') {
    result.enabled = value.enabled
  }
  if (value.agentId === null || typeof value.agentId === 'string') {
    result.agentId = value.agentId
  }
  const models = copySafeStringRecord(value.selectedModelByAgent, 512)
  if (models) {
    result.selectedModelByAgent = models
  }
  const thinking = copySafeStringRecord(value.selectedThinkingByModel, 256)
  if (thinking) {
    result.selectedThinkingByModel = thinking
  }
  const instructions = copySafeStringRecord(value.instructionsByOperation)
  if (instructions) {
    result.instructionsByOperation = instructions
  }
  if (isRecord(value.prCreationDefaults)) {
    const defaults: PortableValueMap = {}
    for (const key of ['draft', 'useTemplate', 'generateDetailsOnOpen', 'openAfterCreate']) {
      if (typeof value.prCreationDefaults[key] === 'boolean') {
        defaults[key] = value.prCreationDefaults[key]
      }
    }
    if (Object.keys(defaults).length > 0) {
      result.prCreationDefaults = defaults
    }
  }
  return Object.keys(result).length > 0 ? result : undefined
}

function projectNativeChatSessionOptions(value: unknown): PortableValueMap | undefined {
  if (!isRecord(value) || Object.keys(value).length > 100) {
    return undefined
  }
  const result: PortableValueMap = {}
  for (const [agentId, rawOptions] of Object.entries(value)) {
    if (!isSafeObjectKey(agentId) || !isRecord(rawOptions)) {
      return undefined
    }
    const model = copySafeString(rawOptions.model)
    if (model !== undefined) {
      result[agentId] = { model }
    }
  }
  return Object.keys(result).length > 0 ? result : undefined
}

function projectSettings(raw: unknown): PortableValueMap {
  if (!isRecord(raw)) {
    return {}
  }
  const result: PortableValueMap = {}
  for (const key of PORTABLE_STRING_SETTING_KEYS) {
    const value = raw[key]
    const allowed = SAFE_SETTING_STRING_VALUES[key]
    if (allowed && (typeof value !== 'string' || !allowed.includes(value))) {
      continue
    }
    const copied = copySafeString(value)
    if (copied !== undefined) {
      result[key] = copied
    }
  }
  for (const key of PORTABLE_NULLABLE_STRING_SETTING_KEYS) {
    const copied = raw[key] === null ? null : copySafeString(raw[key])
    if (copied !== undefined || raw[key] === null) {
      result[key] = copied
    }
  }
  for (const key of PORTABLE_BOOLEAN_SETTING_KEYS) {
    if (typeof raw[key] === 'boolean') {
      result[key] = raw[key]
    }
  }
  for (const key of PORTABLE_NUMBER_SETTING_KEYS) {
    const copied = copySafeNumber(raw[key])
    if (copied !== undefined) {
      result[key] = copied
    }
  }
  for (const key of PORTABLE_STRING_ARRAY_SETTING_KEYS) {
    const copied = copySafeStringArray(raw[key])
    if (copied !== undefined) {
      result[key] = copied
    }
  }
  for (const key of PORTABLE_COMPLEX_SETTING_KEYS) {
    const copied = cloneBoundedJson(raw[key])
    if (copied !== undefined) {
      result[key] = copied
    }
  }
  const notifications = projectNotifications(raw.notifications)
  if (notifications) {
    result.notifications = notifications
  }
  const commitMessageAi = projectCommitMessageAi(raw.commitMessageAi)
  if (commitMessageAi) {
    result.commitMessageAi = commitMessageAi
  }
  const sourceControlAi = projectSourceControlAi(raw.sourceControlAi)
  if (sourceControlAi) {
    result.sourceControlAi = sourceControlAi
  }
  const nativeChat = projectNativeChatSessionOptions(raw.nativeChatSessionOptions)
  if (nativeChat) {
    result.nativeChatSessionOptions = nativeChat
  }
  return result
}

function projectUI(raw: unknown): PortableValueMap {
  if (!isRecord(raw)) {
    return {}
  }
  const result: PortableValueMap = {}
  for (const key of PORTABLE_BOOLEAN_UI_KEYS) {
    if (typeof raw[key] === 'boolean') {
      result[key] = raw[key]
    }
  }
  for (const key of PORTABLE_NUMBER_UI_KEYS) {
    const copied = copySafeNumber(raw[key])
    if (copied !== undefined) {
      result[key] = copied
    }
  }
  for (const key of PORTABLE_STRING_UI_KEYS) {
    if (raw[key] === null && key === 'browserDefaultSearchEngine') {
      result[key] = null
    } else {
      const copied = copySafeString(raw[key])
      if (copied !== undefined) {
        result[key] = copied
      }
    }
  }
  for (const key of PORTABLE_COMPLEX_UI_KEYS) {
    const copied = cloneBoundedJson(raw[key])
    if (copied !== undefined) {
      result[key] = copied
    }
  }
  return result
}

export function projectPortableSettings(raw: unknown): PortableSettingsProjection {
  const root = isRecord(raw) ? raw : {}
  return { settings: projectSettings(root.settings), ui: projectUI(root.ui) }
}

export function projectPortableSettingsUpdate(updates: Partial<GlobalSettings>): PortableValueMap {
  return projectSettings(updates)
}

export function projectPortableUIUpdate(updates: Partial<PersistedState['ui']>): PortableValueMap {
  return projectUI(updates)
}

export function mergePortableSettingsProjections(
  left: PortableSettingsProjection,
  right: PortableSettingsProjection
): PortableSettingsProjection {
  const merge = (first: PortableValueMap, second: PortableValueMap): PortableValueMap => {
    const result: PortableValueMap = { ...first }
    for (const [key, value] of Object.entries(second)) {
      result[key] = isRecord(result[key]) && isRecord(value) ? { ...result[key], ...value } : value
    }
    return result
  }
  return { settings: merge(left.settings, right.settings), ui: merge(left.ui, right.ui) }
}

export function portableProjectionHasValues(projection: PortableSettingsProjection): boolean {
  return Object.keys(projection.settings).length > 0 || Object.keys(projection.ui).length > 0
}
