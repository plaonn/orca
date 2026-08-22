import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PersistedState } from '../../shared/persisted-state-types'
import {
  PORTABLE_SETTINGS_OVERRIDE_FILE,
  PortableSettingsInheritance
} from './portable-settings-inheritance'
import { projectPortableSettings } from './portable-settings-projection'

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp/orca-test-user-data' }
}))

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

function makeState(): PersistedState {
  return {
    settings: {
      theme: 'light',
      terminalFontSize: 11,
      defaultTuiAgent: null,
      sourceControlAi: {
        enabled: true,
        agentId: null,
        selectedModelByAgent: {},
        selectedThinkingByModel: {},
        customAgentCommand: 'dev-command',
        instructionsByOperation: {}
      },
      activeRuntimeEnvironmentId: null,
      experimentalMobile: false
    },
    ui: {
      sidebarWidth: 220,
      lastActiveRepoId: null,
      filterRepoIds: []
    }
  } as unknown as PersistedState
}

function createProfiles(): { stable: string; dev: string; stableDataFile: string } {
  const root = mkdtempSync(join(tmpdir(), 'orca-portable-settings-'))
  tempRoots.push(root)
  const stable = join(root, 'stable')
  const dev = join(root, 'dev')
  const profileDirectory = join(stable, 'profiles', 'local-default')
  mkdirSync(profileDirectory, { recursive: true })
  writeFileSync(
    join(stable, 'orca-profile-index.json'),
    JSON.stringify({
      schemaVersion: 1,
      activeProfileId: 'local-default',
      profiles: [
        {
          id: 'local-default',
          name: 'Local',
          kind: 'local',
          createdAt: 1,
          updatedAt: 1,
          lastOpenedAt: 1,
          avatar: { kind: 'initials', initials: 'L', color: 'neutral' }
        }
      ]
    }),
    'utf-8'
  )
  const stableDataFile = join(profileDirectory, 'orca-data.json')
  writeFileSync(
    stableDataFile,
    JSON.stringify({
      settings: {
        theme: 'dark',
        terminalFontSize: 19,
        defaultTuiAgent: 'codex',
        sourceControlAi: {
          enabled: false,
          agentId: 'codex',
          selectedModelByAgent: { codex: 'gpt-5' },
          selectedThinkingByModel: { 'gpt-5': 'high' },
          customAgentCommand: 'stable-secret-command'
        },
        activeRuntimeEnvironmentId: 'stable-runtime',
        opencodeSessionCookie: 'stable-secret',
        experimentalMobile: true
      },
      ui: {
        sidebarWidth: 360,
        lastActiveRepoId: 'stable-repo',
        filterRepoIds: ['stable-repo'],
        activeView: 'tasks'
      }
    }),
    'utf-8'
  )
  writeFileSync(join(stable, 'orca-devices.json'), 'stable-devices', 'utf-8')
  writeFileSync(join(stable, 'orca-e2ee-keypair.json'), 'stable-keypair', 'utf-8')
  writeFileSync(join(stable, 'orca-runtime.json'), 'stable-runtime-pointer', 'utf-8')
  mkdirSync(dev, { recursive: true })
  return { stable, dev, stableDataFile }
}

describe('portable settings inheritance', () => {
  it('projects preferences while excluding runtime, session, mobile, and credential state', () => {
    const projection = projectPortableSettings({
      settings: {
        theme: 'dark',
        terminalFontSize: 19,
        defaultTuiAgent: 'codex',
        activeRuntimeEnvironmentId: 'runtime',
        opencodeSessionCookie: 'secret',
        experimentalMobile: true
      },
      ui: {
        sidebarWidth: 360,
        activeView: 'tasks',
        lastActiveRepoId: 'repo',
        filterRepoIds: ['repo']
      }
    })

    expect(projection.settings).toMatchObject({ theme: 'dark', terminalFontSize: 19 })
    expect(projection.settings).not.toHaveProperty('activeRuntimeEnvironmentId')
    expect(projection.settings).not.toHaveProperty('opencodeSessionCookie')
    expect(projection.settings).not.toHaveProperty('experimentalMobile')
    expect(projection.ui).toMatchObject({ sidebarWidth: 360 })
    expect(projection.ui).not.toHaveProperty('activeView')
    expect(projection.ui).not.toHaveProperty('lastActiveRepoId')
    expect(projection.ui).not.toHaveProperty('filterRepoIds')
  })

  it('reads the stable active profile, preserves dev-only fields, and layers local overrides', () => {
    const { stable, dev, stableDataFile } = createProfiles()
    const dataFile = join(dev, 'orca-data.json')
    writeFileSync(dataFile, JSON.stringify({ settings: {}, ui: {} }), 'utf-8')
    writeFileSync(join(dev, 'orca-devices.json'), 'dev-devices', 'utf-8')
    writeFileSync(join(dev, 'orca-e2ee-keypair.json'), 'dev-keypair', 'utf-8')
    writeFileSync(join(dev, 'orca-runtime.json'), 'dev-runtime-pointer', 'utf-8')
    const stableBefore = readFileSync(stableDataFile, 'utf-8')
    const inheritance = new PortableSettingsInheritance({
      dataFile,
      stableUserDataPath: stable
    })
    const state = makeState()

    expect(inheritance.apply(state)).toBe(true)
    expect(state.settings.theme).toBe('dark')
    expect(state.settings.terminalFontSize).toBe(19)
    expect(state.settings.defaultTuiAgent).toBe('codex')
    expect(state.settings.activeRuntimeEnvironmentId).toBeNull()
    expect(state.settings.experimentalMobile).toBe(false)
    expect(state.settings.sourceControlAi?.customAgentCommand).toBe('dev-command')
    expect(state.settings.sourceControlAi?.selectedModelByAgent).toEqual({ codex: 'gpt-5' })
    expect(state.ui.sidebarWidth).toBe(360)
    expect(state.ui.lastActiveRepoId).toBeNull()
    expect(readFileSync(join(dev, 'orca-devices.json'), 'utf-8')).toBe('dev-devices')
    expect(readFileSync(join(dev, 'orca-e2ee-keypair.json'), 'utf-8')).toBe('dev-keypair')
    expect(readFileSync(join(dev, 'orca-runtime.json'), 'utf-8')).toBe('dev-runtime-pointer')
    expect(readFileSync(stableDataFile, 'utf-8')).toBe(stableBefore)

    inheritance.recordSettingsUpdate({ theme: 'light', activeRuntimeEnvironmentId: 'dev-runtime' })
    inheritance.recordUIUpdate({ sidebarWidth: 410, lastActiveRepoId: 'dev-repo' })
    const overrides = JSON.parse(
      readFileSync(join(dev, PORTABLE_SETTINGS_OVERRIDE_FILE), 'utf-8')
    ) as { settings: Record<string, unknown>; ui: Record<string, unknown> }
    expect(overrides.settings).toMatchObject({ theme: 'light' })
    expect(overrides.settings).not.toHaveProperty('activeRuntimeEnvironmentId')
    expect(overrides.ui).toMatchObject({ sidebarWidth: 410 })
    expect(overrides.ui).not.toHaveProperty('lastActiveRepoId')

    const restarted = makeState()
    expect(
      new PortableSettingsInheritance({ dataFile, stableUserDataPath: stable }).apply(restarted)
    ).toBe(true)
    expect(restarted.settings.theme).toBe('light')
    expect(restarted.ui.sidebarWidth).toBe(410)
  })

  it('fails closed when the dev override file is malformed', () => {
    const { stable, dev } = createProfiles()
    const dataFile = join(dev, 'orca-data.json')
    writeFileSync(dataFile, JSON.stringify({ settings: {}, ui: {} }), 'utf-8')
    writeFileSync(
      join(dev, PORTABLE_SETTINGS_OVERRIDE_FILE),
      JSON.stringify({ version: 99 }),
      'utf-8'
    )
    const state = makeState()

    expect(
      new PortableSettingsInheritance({ dataFile, stableUserDataPath: stable }).apply(state)
    ).toBe(false)
    expect(state.settings.theme).toBe('light')
    expect(state.ui.sidebarWidth).toBe(220)
  })
})
