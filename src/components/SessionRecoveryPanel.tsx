import { useState } from "react";
import { invokeBackend } from "../lib/platform";
import type { RecoveryState } from "../lib/sessionRecovery";

export function SessionRecoveryPanel({ state, onDismiss }: {
  state: RecoveryState;
  onDismiss: () => void;
}) {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const report = state.status === "complete" ? state.report : null;

  const openConversation = async (sessionId: string) => {
    setOpeningId(sessionId);
    setOpenError(null);
    try {
      await invokeBackend("open_codex_recovery_conversation", { sessionId });
    } catch (error) {
      setOpenError(`无法打开对话 ${sessionId}：${String(error)}`);
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <section aria-label="对话恢复" className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-semibold">对话恢复</h2>
        {state.status !== "running" && (
          <button onClick={onDismiss} className="text-sm text-gray-600 underline dark:text-gray-300">关闭恢复报告</button>
        )}
      </div>
      <div role="status" aria-live="polite" className="mt-2 text-sm text-gray-700 dark:text-gray-200">
        {state.status === "running" && (
          <>
            <p>{state.progress.current_session_id
              ? `正在检查第 ${state.progress.completed + 1} / ${state.progress.total} 个对话…`
              : `已检查 ${state.progress.completed} / ${state.progress.total} 个对话…`}</p>
            <progress aria-label="恢复进度" value={state.progress.completed} max={Math.max(1, state.progress.total)} className="mt-2 h-2 w-full accent-orange-600" />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">恢复检查最多进行两分钟，排队中的消息之后仍可能开始执行。</p>
          </>
        )}
        {state.status === "error" && <p className="text-red-600 dark:text-red-300">{state.message}</p>}
        {report && (
          <>
            <p>{report.resumed.length + report.skipped.length + report.failed.length === 0
              ? "没有找到需要恢复的对话。"
              : `已继续 ${report.resumed.length} 个对话。${report.skipped.length} 个无需恢复，${report.failed.length} 个需要处理。`}</p>
            {report.timed_out && <p className="mt-2 text-amber-700 dark:text-amber-300">已达到两分钟的恢复上限。待发送的消息及其回执都已保留，打开对话可能会开始排队中的续写。</p>}
          </>
        )}
      </div>
      {!!report?.failed.length && (
        <ul className="mt-3 max-h-72 space-y-3 overflow-y-auto">
          {report.failed.map((failure) => (
            <li key={failure.session_id} className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
              <p className="break-all font-mono text-xs">{failure.session_id}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-gray-600 dark:text-gray-300">{failure.reason}</p>
              <button onClick={() => void openConversation(failure.session_id)} disabled={openingId !== null} className="mt-2 rounded-md border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700">
                {openingId === failure.session_id ? "打开中…" : "打开对话"}
              </button>
            </li>
          ))}
        </ul>
      )}
      {openError && <p role="alert" className="mt-3 break-words text-sm text-red-600 dark:text-red-300">{openError}</p>}
    </section>
  );
}
