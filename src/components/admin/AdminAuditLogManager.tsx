'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  Layers,
  FileText,
} from '@/components/icons/MinimalIcons';
import { IAuditLog } from '@/backend/repositories/AuditLogRepository';

export function AdminAuditLogManager() {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, warning: 0, info: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedSeverity !== 'all') params.append('severity', selectedSeverity);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Lỗi tải nhật ký kiểm toán:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedSeverity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
          label: 'Nghiêm Trọng',
          className: 'bg-rose-50 text-rose-800 border-rose-300',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          label: 'Cảnh Báo',
          className: 'bg-amber-50 text-amber-800 border-amber-300',
        };
      default:
        return {
          icon: <Info className="w-3.5 h-3.5" />,
          label: 'Thông Thường',
          className: 'bg-cyan-50 text-cyan-800 border-cyan-300',
        };
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header Banner */}
      <div className="vision-glass-panel rounded-[32px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/80 bg-white/90 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-800 shrink-0 shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Nhật Ký Kiểm Toán Hệ Thống (Audit Trail)
              </h2>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-200">
                AUDIT LOGS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ghi nhận bất biến mọi thay đổi nhạy cảm: Quyền hạn RBAC, kiểm duyệt gian hàng, điều phối máy in xưởng và giao dịch hoàn tiền.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm Mới Log</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="vision-glass rounded-[24px] p-4 space-y-1 border border-slate-200/80 bg-white/90 shadow-sm">
          <div className="text-[11px] text-slate-500 font-semibold">Tổng Bản Ghi</div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-[10px] text-slate-400">Lịch sử sự kiện</div>
        </div>

        <div className="vision-glass rounded-[24px] p-4 space-y-1 border border-rose-200 bg-rose-50/50 shadow-sm">
          <div className="text-[11px] text-rose-700 font-bold">Nghiêm Trọng (Critical)</div>
          <div className="text-2xl font-black text-rose-800">{stats.critical}</div>
          <div className="text-[10px] text-rose-600">Thay đổi quyền &amp; giải ngân</div>
        </div>

        <div className="vision-glass rounded-[24px] p-4 space-y-1 border border-amber-200 bg-amber-50/50 shadow-sm">
          <div className="text-[11px] text-amber-700 font-bold">Cảnh Báo (Warning)</div>
          <div className="text-2xl font-black text-amber-800">{stats.warning}</div>
          <div className="text-[10px] text-amber-600">Đổi môi trường &amp; hủy đơn</div>
        </div>

        <div className="vision-glass rounded-[24px] p-4 space-y-1 border border-cyan-200 bg-cyan-50/50 shadow-sm">
          <div className="text-[11px] text-cyan-700 font-bold">Thông Thường (Info)</div>
          <div className="text-2xl font-black text-cyan-800">{stats.info}</div>
          <div className="text-[10px] text-cyan-600">Duyệt hàng &amp; gán máy in</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="vision-glass rounded-[28px] p-4 border border-slate-200/80 bg-white/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo sự kiện, người thực hiện, mô tả..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white shadow-sm"
          />
        </form>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {['all', 'critical', 'warning', 'info'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all whitespace-nowrap border ${
                selectedSeverity === sev
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {sev === 'all' ? 'Tất Cả' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="vision-glass rounded-[32px] p-5 sm:p-6 border border-slate-200/80 bg-white/90 shadow-sm space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Đang truy vấn nhật ký kiểm toán...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs">Không tìm thấy bản ghi kiểm toán phù hợp.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {logs.map((log) => {
              const badge = getSeverityBadge(log.severity);
              return (
                <div key={log.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors rounded-2xl px-2">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-slate-700 text-xs px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                        {log.id}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{log.actionTitle}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed">{log.description}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 text-cyan-800 font-semibold">
                        <User className="w-3 h-3 text-cyan-600" />
                        <strong>{log.actorName}</strong> ({log.actorRole.toUpperCase()})
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>Thực thể: <strong className="text-slate-700">{log.entityType}</strong> {log.entityId ? `(#${log.entityId})` : ''}</span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 shrink-0 flex items-center md:flex-col md:items-end justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
