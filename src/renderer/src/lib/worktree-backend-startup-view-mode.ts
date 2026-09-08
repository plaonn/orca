import { useAppStore } from '@/store'
import { decideInitialAgentTabViewMode } from '@/lib/native-chat-initial-view-mode'
import { isNativeChatTranscriptLocalReadable } from '@/lib/native-chat-transcript-readability'
import { nativeChatRequiresLocalTranscript } from '@/lib/native-chat-supported-agent'
import type { WorktreeCreationRequest } from '@/lib/pending-worktree-creation'

/** Applies the native-chat initial-view policy to backend-spawned agent launches. */
export function resolveBackendStartupViewMode(
  request: WorktreeCreationRequest
): WorktreeCreationRequest['startup'] {
  if (!request.startup || !request.agent) {
    return request.startup
  }
  const state = useAppStore.getState()
  const repo = state.repos.find((entry) => entry.id === request.repoId)
  const connectionId = repo ? (repo.connectionId ?? null) : undefined
  const promptDelivery = request.launchDraftPrompt ? ('draft' as const) : ('auto-submit' as const)
  const viewMode =
    decideInitialAgentTabViewMode({
      experimentalNativeChat: state.settings?.experimentalNativeChat,
      openAgentTabsInChatByDefault: state.settings?.openAgentTabsInChatByDefault,
      agent: request.agent,
      promptDelivery,
      ...(request.launchDraftPrompt ? { launchDraftText: request.launchDraftPrompt } : {}),
      ...(nativeChatRequiresLocalTranscript(request.agent)
        ? {
            nativeChatTranscriptIsLocalReadable: isNativeChatTranscriptLocalReadable(connectionId)
          }
        : {})
    }) ?? 'terminal'
  return { ...request.startup, viewMode }
}
