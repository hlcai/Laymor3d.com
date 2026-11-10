import React, { useState } from 'react';
import { ISimulationProfile } from '@/types/simulator';
import {
  IconTerminal,
  IconCheckShield,
  IconChevronDown,
  IconChevronUp,
  IconReset,
  IconLayers,
  IconSupport,
} from '@/components/icons/MinimalIcons';

export interface ISimulationLogEntry {
  id: string;
  runNumber: number;
  timestamp: string;
  triggerLabel: string;
  modelName: string;
  material: string;
  layerHeight: number;
  infillDensity: number;
  infillType: string;
  supportMode: string;
  printSpeed: number;
  nozzleTemp: number;
  estimatedTimeSec: number;
  filamentGrams: number;
  totalLayers: number;
  score: number;
  overhangPercent: number;
  profileSnapshot: ISimulationProfile;
}

interface SimulationRunLogPanelProps {
  logs: ISimulationLogEntry[];
  isProfileOpen: boolean;
  onRecordManualLog: () => void;
  onRestoreProfile: (profile: ISimulationProfile) => void;
  onClearLogs: () => void;
  onOpenReportWithLog?: (logId: string) => void;
}

function formatDurationShort(sec: number): string {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${s}s`;
  return `${s}s`;
}

export function SimulationRunLogPanel({
  logs,
  onRecordManualLog,
  onRestoreProfile,
  onClearLogs,
}: SimulationRunLogPanelProps) {
  // Mặc định thu gọn dạng pill gọn gàng để không bao giờ che khuất BuildPlateToolbar hoặc bàn in 3D trên màn hình nhỏ
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const latestLog = logs[0];

  return (
    <div
      data-testid="simulation-run-log-panel"
      className="absolute top-2.5 left-15 lg:left-3 z-20 pointer-events-auto transition-all duration-200 max-w-[calc(100%-72px)] lg:max-w-[312px]"
    >
      <div
        className={`rounded-2xl glass-panel overflow-hidden shadow-lg border studio-border transition-all ${
          isExpanded ? 'w-[min(308px,calc(100vw-24px))]' : 'w-auto'
        }`}
      >
        {/* Header Bar */}
        <div className="px-2.5 py-1.5 flex items-center justify-between gap-2 bg-[var(--bg-subtle)]">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-2 text-left cursor-pointer group min-w-0"
            title={isExpanded ? 'Thu gọn bảng nhật ký mô phỏng' : 'Mở rộng bảng nhật ký mô phỏng'}
          >
            <div className="w-6 h-6 rounded-lg studio-gold-badge flex items-center justify-center shrink-0">
              <IconTerminal size={12} />
            </div>
            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider studio-text-primary whitespace-nowrap">
                  Nhật Ký
                </span>
                <span className="px-1.5 py-0.2 rounded studio-gold-badge font-mono text-[9px] font-bold">
                  {logs.length}
                </span>
              </div>
              {isExpanded && latestLog && (
                <p className="text-[9px] studio-text-secondary font-mono truncate max-w-[145px]">
                  #{String(latestLog.runNumber).padStart(2, '0')} • {latestLog.material} • Điểm {latestLog.score}
                </p>
              )}
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              data-testid="record-simulation-log-btn"
              onClick={onRecordManualLog}
              className="px-2 py-1 rounded-lg studio-cta-primary text-[10px] font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              title="Lưu thông số cấu hình hiện tại vào Nhật ký mô phỏng"
            >
              + Ghi Log
            </button>
            <button
              type="button"
              data-testid="toggle-simulation-log-btn"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-label={isExpanded ? 'Thu gọn nhật ký' : 'Mở rộng nhật ký'}
              className="w-6 h-6 rounded-lg studio-card hover:bg-[var(--bg-hover)] studio-text-secondary hover:studio-text-primary flex items-center justify-center transition-all cursor-pointer"
              title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            >
              {isExpanded ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Expanded Log Entries List */}
        {isExpanded && (
          <div className="p-2.5 border-t studio-border space-y-2 max-h-[min(250px,42dvh)] overflow-y-auto text-[10px]">
            {logs.map((entry, idx) => {
              const prevEntry = logs[idx + 1];
              const scoreDelta = prevEntry ? entry.score - prevEntry.score : 0;

              return (
                <div
                  key={entry.id}
                  className={`p-2.5 rounded-xl transition-all ${
                    idx === 0
                      ? 'studio-gold-badge'
                      : 'studio-card hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono font-bold text-[10px] studio-text-primary">
                        #{String(entry.runNumber).padStart(2, '0')}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] border studio-border text-[9px] font-medium studio-text-primary truncate max-w-[85px]">
                        {entry.triggerLabel}
                      </span>
                      <span className="text-[9px] font-mono studio-text-muted shrink-0">
                        {entry.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {scoreDelta !== 0 && (
                        <span
                          className={`text-[9px] font-mono font-bold ${
                            scoreDelta > 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}đ
                        </span>
                      )}
                      <span
                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono font-bold text-[9px] ${
                          entry.score >= 80
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : entry.score >= 50
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        <IconCheckShield size={10} />
                        <span>{entry.score}/100</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 font-mono text-[9px] py-1 border-y studio-border my-1 studio-text-secondary">
                    <div className="truncate" title={`Vật liệu & Nhiệt độ: ${entry.material} ${entry.nozzleTemp}°C`}>
                      <strong className="studio-text-primary">{entry.material}</strong> {entry.nozzleTemp}°C
                    </div>
                    <div className="truncate flex items-center gap-1" title="Độ dày lớp & Mật độ ruột">
                      <IconLayers size={9} className="studio-text-gold shrink-0" />
                      <span>{entry.layerHeight}mm • {entry.infillDensity}%</span>
                    </div>
                    <div className="truncate flex items-center gap-1" title="Chế độ cây chống Support">
                      <IconSupport size={9} className="studio-text-gold shrink-0" />
                      <span className="uppercase">
                        {entry.supportMode === 'none' ? 'No Sup' : entry.supportMode}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 font-mono text-[9px] pt-1">
                    <div className="flex items-center gap-1.5 studio-text-secondary text-[9px]">
                      <span>
                        <strong className="studio-text-primary">{formatDurationShort(entry.estimatedTimeSec)}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="studio-text-primary">{entry.filamentGrams.toFixed(1)}g</strong>
                      </span>
                      <span>•</span>
                      <span>L{entry.totalLayers}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRestoreProfile(entry.profileSnapshot)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md studio-card hover:bg-[var(--bg-hover)] studio-text-gold font-sans font-semibold text-[9px] transition-all cursor-pointer active:scale-95 shrink-0"
                      title="Khôi phục cấu hình của lần chạy này ra Studio 3D"
                    >
                      <IconReset size={10} />
                      <span>Khôi phục</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {logs.length > 1 && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={onClearLogs}
                  className="text-[9px] studio-text-muted hover:studio-text-primary transition-colors cursor-pointer"
                >
                  Xóa lịch sử cũ (Giữ bản ghi mới nhất)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
