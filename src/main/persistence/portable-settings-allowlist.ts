import type { GlobalSettings } from '../../shared/global-settings-types'
import type { PersistedState } from '../../shared/persisted-state-types'

function keys<T extends string>(value: string): readonly T[] {
  return value.split(' ') as unknown as readonly T[]
}

export const PORTABLE_STRING_SETTING_KEYS = keys<keyof GlobalSettings>(
  'branchPrefix branchPrefixCustom theme leftSidebarAppearanceMode uiLanguage appIcon appFontFamily editorFontFamily terminalFontFamily terminalGpuAcceleration terminalLigatures terminalCursorStyle terminalThemeDark terminalDividerColorDark terminalThemeLight terminalDividerColorLight terminalWordSeparator claudeAgentTeamsMode setupScriptLaunchMode sourceControlViewMode sourceControlGroupOrder ctrlTabOrderMode terminalShortcutPolicy terminalMacOptionAsAlt defaultTaskViewPreset defaultTaskSource experimentalAgentDashboardMode floatingTerminalTriggerLocation diffDefaultView'
)

export const PORTABLE_NULLABLE_STRING_SETTING_KEYS = keys<keyof GlobalSettings>('defaultTuiAgent')

export const PORTABLE_BOOLEAN_SETTING_KEYS = keys<keyof GlobalSettings>(
  'nestWorkspaces refreshLocalBaseRefOnWorktreeCreate localBaseRefSuggestionDismissed autoRenameBranchFromWork editorAutoSave editorMinimapEnabled editorWordWrap richMarkdownSpellcheckEnabled markdownReviewToolsEnabled primarySelectionMiddleClickPaste terminalCursorBlink terminalUseSeparateLightTheme windowBackgroundBlur minimizeToTrayOnClose showMenuBarIcon terminalRightClickToPaste terminalFocusFollowsMouse terminalClipboardOnSelect terminalAllowOsc52Clipboard openLinksInApp localhostWorktreeLabelsEnabled openLinksInAppPreferencePrompted openLinksInAppModifierInverts terminalLinkActionPopoverEnabled openAgentTabsInChatByDefault experimentalNativeChat rightSidebarOpenByDefault showGitIgnoredFiles sourceControlCompareAgainstUpstream showTitlebarAppName showTasksButton showAutomationsButton showArtifactsButton showSkillsButton showMobileButton showPinnedWorktreesInGroups floatingTerminalEnabled diffWordWrap combinedDiffFileTreeVisibleByDefault promptCacheTimerEnabled terminalScopeHistoryByWorktree terminalHiddenViewParking terminalSshViewParking terminalHiddenWorktreeRetentionBudget browserGuestWorktreeRetentionBudget tabAutoGenerateTitle confirmClosePinnedTab keepComputerAwakeWhileAgentsRun terminalJISYenToBackslash experimentalPet experimentalActivity experimentalAgentDashboardPopout experimentalAgentDashboardShowIdle experimentalTerminalAttention experimentalAgentHibernation experimentalNewWorktreeCardStyle compactWorktreeCards skipDeleteWorktreeConfirm skipCloseTerminalWithRunningProcessConfirm skipDeleteAutomationConfirm skipDeleteArtifactConfirm skipCodexRateLimitResetConfirm'
)

export const PORTABLE_NUMBER_SETTING_KEYS = keys<keyof GlobalSettings>(
  'leftSidebarTintOpacity editorAutoSaveDelayMs terminalFontSize terminalFontWeight terminalFontWeightBold terminalLineHeight terminalScrollSensitivity terminalFastScrollSensitivity terminalTuiScrollSensitivity terminalInactivePaneOpacity terminalActivePaneOpacity terminalPaneOpacityTransitionMs terminalDividerThicknessPx terminalBackgroundOpacity terminalPaddingX terminalPaddingY terminalCursorOpacity terminalScrollbackRows promptCacheTtlMs agentHibernationIdleMs'
)

export const PORTABLE_STRING_ARRAY_SETTING_KEYS = keys<keyof GlobalSettings>(
  'disabledTuiAgents visibleTaskProviders'
)

export const PORTABLE_COMPLEX_SETTING_KEYS = keys<keyof GlobalSettings>(
  'terminalCustomThemes terminalColorOverrides'
)

export const PORTABLE_BOOLEAN_UI_KEYS = keys<keyof PersistedState['ui']>(
  'rightSidebarOpen showActiveOnly hideSleepingWorkspaces showSleepingWorkspaces showInactiveWorkspaces hideDefaultBranchWorkspace hideAutomationGeneratedWorkspaces hideCliCreatedWorkspaces hideDetachedHeadWorkspaces hideWorkspacesFromOtherDevices alwaysShowDefaultBranchWorkspace syncTaskStatusFromWorkspaceBoard statusBarVisible setupGuideSidebarDismissed browserImportHintHidden'
)

export const PORTABLE_NUMBER_UI_KEYS = keys<keyof PersistedState['ui']>(
  'sidebarWidth rightSidebarWidth markdownTocPanelWidth combinedDiffFileTreeWidth uiZoomLevel editorFontZoomLevel workspaceBoardOpacity workspaceBoardColumnWidth browserDefaultZoomLevel'
)

export const PORTABLE_STRING_UI_KEYS = keys<keyof PersistedState['ui']>(
  'rightSidebarTab rightSidebarExplorerView groupBy sortBy projectOrderBy agentActivityDisplayMode usagePercentageDisplay statusBarUsageMode browserDefaultUrl browserDefaultSearchEngine'
)

export const PORTABLE_COMPLEX_UI_KEYS = keys<keyof PersistedState['ui']>(
  'worktreeCardProperties workspaceStatuses statusBarItems'
)

export const SAFE_SETTING_STRING_VALUES: Record<string, readonly string[]> = {
  theme: ['system', 'dark', 'light'],
  leftSidebarAppearanceMode: ['default', 'match-terminal', 'tinted'],
  terminalGpuAcceleration: ['auto', 'on', 'off'],
  terminalLigatures: ['auto', 'on', 'off'],
  terminalCursorStyle: ['bar', 'block', 'underline'],
  sourceControlViewMode: ['list', 'tree'],
  sourceControlGroupOrder: ['changes-first', 'staged-first', 'untracked-first'],
  ctrlTabOrderMode: ['mru', 'sequential'],
  terminalShortcutPolicy: ['orca-first', 'terminal-first'],
  terminalMacOptionAsAlt: ['auto', 'true', 'false', 'left', 'right'],
  defaultTaskViewPreset: ['all', 'issues', 'review', 'my-issues', 'my-prs', 'prs'],
  defaultTaskSource: ['github', 'gitlab', 'linear', 'jira'],
  experimentalAgentDashboardMode: ['in-window', 'popout'],
  floatingTerminalTriggerLocation: ['floating-button', 'status-bar'],
  diffDefaultView: ['inline', 'side-by-side']
}

export const SAFE_NOTIFICATION_SOUND_IDS = new Set([
  'system',
  'two-tone',
  'bong',
  'thump',
  'blip',
  'sonar',
  'blop',
  'ding',
  'clack',
  'beep',
  'custom'
])
