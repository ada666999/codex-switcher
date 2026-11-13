import { useCallback, useState } from "react";
import type { CodexProcessInfo } from "../types";
import { invokeBackend } from "../lib/platform";

interface KillCodexProcessesResult {
  targeted_count: number;
  killed_pids: number[];
  failed_pids: number[];
  reopen_token?: string | null;
}

interface UseForceCloseCodexProcessesOptions {
  processCount: number;
  checkProcesses: () => Promise<CodexProcessInfo | null>;
  showToast: (message: string, isError?: boolean) => void;
  formatError: (err: unknown) => string;
}

export function useForceCloseCodexProcesses({
  processCount,
  checkProcesses,
  showToast,
  formatError,
}: UseForceCloseCodexProcessesOptions) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isForceClosing, setIsForceClosing] = useState(false);

  const closeCodexProcesses = useCallback(async (reopenDesktop = false, forceClose = false) => {
    try {
      setIsForceClosing(true);

      const result = await invokeBackend<KillCodexProcessesResult>(
        "kill_codex_processes",
        { reopenDesktop, forceClose }
      );
      const latestProcessInfo = await checkProcesses();
      const remainingCount = latestProcessInfo?.count ?? processCount;
      const closedCount = Math.max(0, processCount - remainingCount);

      if (!latestProcessInfo) {
        showToast("无法确认 Codex 已关闭，已跳过切换账号和重新打开。", true);
      } else if (result.targeted_count === 0) {
        showToast("没有正在运行的 Codex 进程。");
      } else if (remainingCount === 0) {
        showToast(
          `${forceClose ? "已强制关闭" : "已关闭"} ${processCount} 个 Codex 会话${
            ""
          }。`
        );
      } else if (closedCount > 0) {
        showToast(
          `${forceClose ? "已强制关闭" : "已关闭"} ${closedCount}/${processCount} 个 Codex 会话，还有 ${remainingCount} 个在运行。`,
          true
        );
      } else {
        showToast(
          `无法${forceClose ? "强制关闭" : "正常关闭"} ${remainingCount} 个 Codex 会话${
            ""
          }。`,
          true
        );
      }

      return { processInfo: latestProcessInfo, reopenToken: result.reopen_token ?? null };
    } catch (err) {
      console.error("Failed to close Codex processes:", err);
      showToast(`关闭失败：${formatError(err)}`, true);
      return null;
    } finally {
      setConfirmOpen(false);
      setIsForceClosing(false);
    }
  }, [checkProcesses, formatError, processCount, showToast]);

  return {
    forceCloseConfirmOpen: confirmOpen,
    setForceCloseConfirmOpen: setConfirmOpen,
    isForceClosingCodex: isForceClosing,
    closeCodexProcesses,
  };
}
