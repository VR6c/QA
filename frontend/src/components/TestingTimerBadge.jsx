import React, { useState, useEffect } from 'react';
import {
  LuPlay as Play,
  LuPause as Pause,
  LuClock as Clock,
  LuCircleCheck as CheckCircle,
  LuCircleAlert as AlertCircle
} from 'react-icons/lu';

export function formatSeconds(totalSecs = 0) {
  const s = Math.max(0, Math.floor(totalSecs));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function TestingTimerBadge({
  task,
  onStartTesting,
  onPauseTesting,
  compact = false,
  variant = 'card'
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(task?.testing_duration_seconds || 0);

  const isActive = Boolean(task?.testing_started_at);
  const isTestingStatus = task?.status === 'testing';
  const isTerminalStatus = ['success', 'done', 'done_production'].includes(task?.status);
  const hasHistory = (task?.testing_duration_seconds || 0) > 0;

  useEffect(() => {
    if (!isActive) {
      setElapsedSeconds(task?.testing_duration_seconds || 0);
      return;
    }

    const calcElapsed = () => {
      const startMs = new Date(task.testing_started_at).getTime();
      const currentMs = Date.now();
      const sessionSecs = Math.max(0, Math.floor((currentMs - startMs) / 1000));
      setElapsedSeconds((task?.testing_duration_seconds || 0) + sessionSecs);
    };

    calcElapsed();
    const interval = setInterval(calcElapsed, 1000);
    return () => clearInterval(interval);
  }, [task?.testing_started_at, task?.testing_duration_seconds, isActive]);

  const handleStart = (e) => {
    e?.stopPropagation();
    if (onStartTesting) onStartTesting(task.id);
  };

  const handlePause = (e, nextStatus = null) => {
    e?.stopPropagation();
    if (onPauseTesting) onPauseTesting(task.id, nextStatus);
  };

  // Table Compact Row Display
  if (variant === 'table') {
    return (
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {isActive ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-mono text-[10px] font-bold shadow-xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <Clock className="w-3 h-3 text-emerald-600 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{formatSeconds(elapsedSeconds)}</span>
            <button
              onClick={(e) => handlePause(e)}
              className="ml-1 p-0.5 hover:bg-emerald-200 text-emerald-900 rounded cursor-pointer transition-colors"
              title="Pause Active Timer"
            >
              <Pause className="w-3 h-3 fill-current" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {hasHistory ? (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold border ${isTerminalStatus
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                <Clock className="w-2.5 h-2.5 opacity-70" />
                {formatSeconds(elapsedSeconds)}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">-</span>
            )}
            {!isTerminalStatus && (
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[9px] font-bold transition-colors cursor-pointer"
                title="Start Active Testing Timer"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Start</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Kanban Card & General Card Display
  return (
    <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[10px]">
      <div className="flex flex-wrap items-center justify-between gap-1.5">

        {/* Timer Status Badge */}
        {isActive ? (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md font-mono font-bold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Clock className="w-3 h-3 text-emerald-600 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="tracking-tight text-xs text-emerald-950 font-extrabold">{formatSeconds(elapsedSeconds)}</span>
          </div>
        ) : hasHistory ? (
          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border ${isTerminalStatus
              ? 'bg-slate-100 text-slate-700 border-slate-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
            {isTerminalStatus ? (
              <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
            ) : (
              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
            )}
            <span>Tested: {formatSeconds(elapsedSeconds)}</span>
          </div>
        ) : (
          <span className="text-[9px] text-slate-400 font-medium italic">Timer idle</span>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1 flex-wrap shrink-0">
          {isActive ? (
            <>
              {/* Pause Timer */}
              <button
                onClick={(e) => handlePause(e)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded font-bold transition-all cursor-pointer shadow-2xs text-[9px]"
                title="Pause testing timer"
              >
                <Pause className="w-2.5 h-2.5 fill-current" />
                <span>Pause</span>
              </button>

              {/* Quick Shift to Success */}
              <button
                onClick={(e) => handlePause(e, 'success')}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold transition-all cursor-pointer shadow-2xs text-[9px]"
                title="Stop testing & mark QA Success"
              >
                <CheckCircle className="w-2.5 h-2.5" />
                <span>Success</span>
              </button>

              {/* Quick Shift to Issue / Feedback */}
              <button
                onClick={(e) => handlePause(e, 'feedback')}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold transition-all cursor-pointer shadow-2xs text-[9px]"
                title="Stop testing & report Feedback/Issue"
              >
                <AlertCircle className="w-2.5 h-2.5" />
                <span>Issue</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleStart}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold transition-all cursor-pointer shadow-2xs text-[9px] ${isTestingStatus
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              title="Start testing clock & switch status to Testing"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>{hasHistory ? 'Resume Testing' : 'Start Testing'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
