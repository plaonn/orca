import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '@/store'
import { resolveBackendStartupViewMode } from './worktree-backend-startup-view-mode'

type AppState = ReturnType<typeof useAppStore.getState>

const initialSettings = useAppStore.getState().settings!
const initialRepos = useAppStore.getState().repos

const request = {
  repoId: 'repo-1',
  startup: { launchCommand: 'omp' },
  launchDraftPrompt: 'https://github.com/o/r/issues/12'
} as never

function setRepoConnection(connectionId: string | null): void {
  useAppStore.setState({
    repos: [{ id: 'repo-1', path: '/repo', connectionId }]
  } as unknown as Partial<AppState>)
}

function viewModeFor(agent: string): string | undefined {
  const startup = resolveBackendStartupViewMode({ ...(request as object), agent } as never) as
    | { viewMode?: string }
    | undefined
  return startup?.viewMode
}

beforeEach(() => {
  useAppStore.setState({
    settings: {
      ...initialSettings,
      experimentalNativeChat: true,
      openAgentTabsInChatByDefault: true
    }
  })
})

afterEach(() => {
  useAppStore.setState({ settings: initialSettings, repos: initialRepos } as Partial<AppState>)
})

describe('resolveBackendStartupViewMode', () => {
  it('opens a local no-prompt backend startup in chat', () => {
    setRepoConnection(null)
    const startup = resolveBackendStartupViewMode({
      ...(request as object),
      agent: 'claude',
      startup: { command: 'claude' },
      launchDraftPrompt: undefined
    } as never) as { command: string; viewMode?: string }

    expect(startup).toEqual({ command: 'claude', viewMode: 'chat' })
  })

  it('keeps an unsupported no-prompt backend startup in the terminal view', () => {
    setRepoConnection(null)
    expect(
      resolveBackendStartupViewMode({
        ...(request as object),
        agent: 'gemini',
        startup: { command: 'gemini' },
        launchDraftPrompt: undefined
      } as never)
    ).toEqual({ command: 'gemini', viewMode: 'terminal' })
  })

  // Why: omp discloses no hook transcript path, so it joins Grok in requiring a
  // locally readable sessions root. This call site must SUPPLY that flag for omp
  // too — gating on Grok alone left it undefined and parked every omp draft in
  // the terminal view, local workspace or not.
  it('opens a local omp draft in chat', () => {
    setRepoConnection(null)
    expect(viewModeFor('omp')).toBe('chat')
  })

  it('keeps a Model-A SSH omp draft in the terminal view', () => {
    setRepoConnection('ssh-target-1')
    expect(viewModeFor('omp')).toBe('terminal')
  })

  it('opens a runtime-owned SSH omp draft in chat, which reads the transcript locally', () => {
    setRepoConnection('runtime-ssh-env-1')
    expect(viewModeFor('omp')).toBe('chat')
  })

  it('preserves the same split for Grok', () => {
    setRepoConnection(null)
    expect(viewModeFor('grok')).toBe('chat')
    setRepoConnection('ssh-target-1')
    expect(viewModeFor('grok')).toBe('terminal')
  })
})
