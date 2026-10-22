'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  Flame,
  ShieldCheck,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Award,
  Edit2,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { IKnowledgeEntry, KnowledgeCategory, ISlicerParameterOverride } from '@/backend/domain/knowledge';

export function AdminKnowledgeManager() {
  const [entries, setEntries] = useState<IKnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Modal Thêm / Chỉnh sửa tri thức & lỗi giả lập
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<KnowledgeCategory>('simulator_defect_learning');
  const [newDefectType, setNewDefectType] = useState('custom_defect');
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [newProblem, setNewProblem] = useState('');
  const [newRootCause, setNewRootCause] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [newFilaments, setNewFilaments] = useState('PLA, PETG');
  const [newPrinters, setNewPrinters] = useState('all');
  const [newTriggerParam, setNewTriggerParam] = useState('');
  const [newTriggerOperator, setNewTriggerOperator] = useState<'>' | '<' | '>=' | '<=' | '==' | '!='>('>');
  const [newTriggerThreshold, setNewTriggerThreshold] = useState('');
  const [newOverridesJson, setNewOverridesJson] = useState('{\n  "retractionDistanceMm": 0.8,\n  "nozzleTemp": 220\n}');
  const [newIsVerified, setNewIsVerified] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchKnowledge = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('query', searchQuery.trim());
      if (selectedCategory !== 'all') params.set('category', selectedCategory);

      const res = await fetch(`/api/knowledge?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.entries)) {
        setEntries(data.entries);
      }
    } catch (err) {
      console.error('Error fetching knowledge:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKnowledge();
  };

  const openCreateModal = () => {
    setEditingEntryId(null);
    setNewTitle('');
    setNewCategory('simulator_defect_learning');
    setNewDefectType('overhang');
    setNewSeverity('high');
    setNewProblem('');
    setNewRootCause('');
    setNewSolution('');
    setNewFilaments('PLA, PETG');
    setNewPrinters('all');
    setNewTriggerParam('');
    setNewTriggerOperator('>');
    setNewTriggerThreshold('');
    setNewOverridesJson('{\n  "supportMode": "tree",\n  "printSpeed": 180\n}');
    setNewIsVerified(true);
    setIsModalOpen(true);
  };

  const openEditModal = (entry: IKnowledgeEntry) => {
    setEditingEntryId(entry.id);
    setNewTitle(entry.title);
    setNewCategory(entry.category);
    setNewDefectType(entry.defectType || 'custom_defect');
    setNewSeverity(entry.severity || 'medium');
    setNewProblem(entry.problemSymptom || '');
    setNewRootCause(entry.rootCause || '');
    setNewSolution(entry.solutionText);
    setNewFilaments((entry.applicableFilaments || ['PLA']).join(', '));
    setNewPrinters((entry.applicablePrinters || ['all']).join(', '));
    setNewTriggerParam(entry.triggerCondition?.paramKey || '');
    setNewTriggerOperator(entry.triggerCondition?.operator || '>');
    setNewTriggerThreshold(
      entry.triggerCondition?.thresholdValue !== undefined ? String(entry.triggerCondition.thresholdValue) : ''
    );
    setNewOverridesJson(
      JSON.stringify(entry.autoFixPatch || entry.slicerOverrides || {}, null, 2)
    );
    setNewIsVerified(entry.isVerified ?? true);
    setIsModalOpen(true);
  };

  const handleToggleVerified = async (entry: IKnowledgeEntry) => {
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entry,
          isVerified: !entry.isVerified,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchKnowledge();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa quy tắc tri thức "${title}"?`)) return;
    try {
      const res = await fetch(`/api/knowledge?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert(data.error || 'Không thể xóa');
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSolution.trim()) {
      alert('Vui lòng nhập tiêu đề lỗi và giải pháp khắc phục.');
      return;
    }

    let parsedOverrides: ISlicerParameterOverride | undefined = undefined;
    if (newOverridesJson.trim()) {
      try {
        parsedOverrides = JSON.parse(newOverridesJson.trim());
      } catch {
        alert('Thông số JSON Auto-Fix / Override không hợp lệ! Vui lòng kiểm tra lại cú pháp.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const triggerCondition = newTriggerParam.trim()
        ? {
            paramKey: newTriggerParam.trim(),
            operator: newTriggerOperator,
            thresholdValue: isNaN(Number(newTriggerThreshold))
              ? newTriggerThreshold.trim()
              : Number(newTriggerThreshold),
          }
        : undefined;

      const payload: Partial<IKnowledgeEntry> = {
        id: editingEntryId || undefined,
        title: newTitle.trim(),
        category: newCategory,
        defectType: newDefectType,
        severity: newSeverity,
        problemSymptom: newProblem.trim() || undefined,
        rootCause: newRootCause.trim() || undefined,
        solutionText: newSolution.trim(),
        applicableFilaments: newFilaments.split(',').map((s) => s.trim()).filter(Boolean),
        applicablePrinters: newPrinters.split(',').map((s) => s.trim()).filter(Boolean),
        slicerOverrides: parsedOverrides,
        autoFixPatch: parsedOverrides,
        triggerCondition,
        isVerified: newIsVerified,
        confidenceScore: 96,
        submittedBy: 'hlcai_admin',
        sourcePlatform: 'expert_curated',
      };

      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchKnowledge();
      } else {
        alert(data.error || 'Lỗi lưu tri thức');
      }
    } catch (err: any) {
      alert(`Lỗi kết nối: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Tất Cả Tri Thức' },
    { id: 'simulator_defect_learning', label: '🧠 Học Lỗi Giả Lập 3D (Từ User & Admin)' },
    { id: 'troubleshooting', label: '🛠️ Khắc Phục Lỗi In' },
    { id: 'slicer_tuning', label: '⚡ Tinh Chỉnh Bambu / OrcaSlicer' },
    { id: 'vietnam_environment', label: '🇻🇳 Khí Hậu Việt Nam' },
    { id: 'material_benchmark', label: '🧪 Định Mức Nhựa' },
    { id: 'printer_hardware', label: '⚙️ Phần Cứng Máy In' },
    { id: 'commercial_practice', label: '🏭 Vận Hành Xưởng In' },
  ];

  const totalVerifications = entries.reduce((sum, e) => sum + (e.verificationCount || 0), 0);
  const avgConfidence = entries.length > 0 ? Math.round(entries.reduce((sum, e) => sum + e.confidenceScore, 0) / entries.length) : 0;
  const simLearnedCount = entries.filter((e) => e.category === 'simulator_defect_learning' || e.defectType).length;

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Banner */}
      <div className="vision-glass-panel rounded-[32px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/80 bg-white/90 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0 shadow-sm">
            <BookOpen className="w-6 h-6 text-cyan-700" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Kho Tri Thức Của App Giả Lập &amp; Học Lỗi In 3D (Admin Control)</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                AI Learning DB
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Toàn quyền quản trị, chỉnh sửa và phê duyệt các lỗi in thực tế cùng giải thích chi tiết do người dùng đóng góp để hệ thống 3D Simulator học và tối ưu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Kiến Thức Lỗi Mới</span>
          </button>

          <button
            type="button"
            onClick={fetchKnowledge}
            disabled={isLoading}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Làm mới kho tri thức"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="vision-glass rounded-[28px] p-5 space-y-1.5 border border-slate-200/80 bg-white/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tổng Quy Tắc Trong DB</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{entries.length} quy tắc</div>
          <div className="text-[11px] text-emerald-700 font-medium">Đồng bộ trực tiếp với /3dsim</div>
        </div>

        <div className="vision-glass rounded-[28px] p-5 space-y-1.5 border border-slate-200/80 bg-white/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Kiến Thức Lỗi Giả Lập</span>
            <Sparkles className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-cyan-700">{simLearnedCount} mẫu lỗi</div>
          <div className="text-[11px] text-slate-500">Có giải thích vật lý &amp; Auto-Fix</div>
        </div>

        <div className="vision-glass rounded-[28px] p-5 space-y-1.5 border border-slate-200/80 bg-white/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Độ Tin Cậy Trung Bình</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{avgConfidence}%</div>
          <div className="text-[11px] text-slate-400">Đã qua kiểm nghiệm thực tế</div>
        </div>

        <div className="vision-glass rounded-[28px] p-5 space-y-1.5 border border-slate-200/80 bg-white/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Lượt Kiểm Chứng</span>
            <CheckCircle2 className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalVerifications.toLocaleString()} ca</div>
          <div className="text-[11px] text-rose-700 font-medium">Từ người dùng &amp; chuyên gia</div>
        </div>
      </div>

      {/* Filter Toolbar & Search */}
      <div className="vision-glass p-4 rounded-[28px] space-y-3.5 border border-slate-200/80 bg-white/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Tìm theo tên lỗi, nguyên nhân gốc rễ, giải pháp, loại nhựa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </form>

          <div className="text-xs text-slate-500">
            Hiển thị <strong className="text-slate-800">{entries.length}</strong> bản ghi tri thức
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-cyan-600 text-white border-cyan-600 font-bold shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Cards Grid */}
      {!isLoading && entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry) => {
            const isExpanded = expandedCardId === entry.id;

            return (
              <div
                key={entry.id}
                className="vision-glass rounded-[28px] p-5 sm:p-6 border border-slate-200/80 bg-white/90 space-y-3.5 hover:border-cyan-300 transition-all flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-2.5">
                  {/* Card Header Badges & Admin Actions */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {entry.category.replace(/_/g, ' ')}
                      </span>
                      {entry.defectType && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                          Mã lỗi: {entry.defectType}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleVerified(entry)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${
                          entry.isVerified
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                        title="Bấm để bật/tắt trạng thái áp dụng học cho App giả lập"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{entry.isVerified ? 'Đang Áp Dụng Học' : 'Chờ Duyệt'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(entry)}
                        className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 transition-all cursor-pointer"
                        title="Chỉnh sửa kiến thức lỗi này"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id, entry.title)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                        title="Xóa quy tắc tri thức này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                    {entry.title}
                  </h3>

                  {/* Applicable Tags */}
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono">
                      Nhựa: {entry.applicableFilaments.join(', ')}
                    </span>
                    {entry.triggerCondition?.paramKey && (
                      <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-mono">
                        Trigger: {entry.triggerCondition.paramKey} {entry.triggerCondition.operator} {String(entry.triggerCondition.thresholdValue)}
                      </span>
                    )}
                    {entry.submittedBy && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-cyan-600" />
                        <span>Đóng góp: {entry.submittedBy}</span>
                      </span>
                    )}
                  </div>

                  {/* Problem & Symptom */}
                  {entry.problemSymptom && (
                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 space-y-0.5">
                      <span className="font-bold text-[11px] block text-rose-700">⚠️ Hiện tượng phát sinh trên mẫu in:</span>
                      <p className="text-[11px] leading-relaxed">{entry.problemSymptom}</p>
                    </div>
                  )}

                  {/* Root Cause Explanation */}
                  {entry.rootCause && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-0.5">
                      <span className="font-bold text-[11px] block text-amber-800">🔬 Giải thích chi tiết nguyên nhân gốc rễ:</span>
                      <p className="text-[11px] leading-relaxed">{entry.rootCause}</p>
                    </div>
                  )}

                  {/* Solution */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1">
                    <span className="font-bold text-[11px] block text-emerald-800">💡 Giải pháp chuẩn &amp; Tối ưu thông số:</span>
                    <p className="text-[11px] text-slate-800 leading-relaxed">{entry.solutionText}</p>
                  </div>

                  {/* Slicer Overrides / Auto-Fix Collapsible */}
                  {(entry.autoFixPatch || entry.slicerOverrides) && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedCardId(isExpanded ? null : entry.id)}
                        className="text-[11px] font-bold text-cyan-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sliders className="w-3 h-3 text-cyan-600" />
                        <span>{isExpanded ? 'Ẩn cấu hình Auto-Fix JSON' : 'Xem cấu hình Auto-Fix / Slicer Override'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isExpanded && (
                        <pre className="mt-2 p-3 rounded-xl bg-slate-900 border border-slate-700 text-[10px] font-mono text-emerald-400 overflow-x-auto">
                          {JSON.stringify(entry.autoFixPatch || entry.slicerOverrides, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Nguồn: <strong className="text-slate-700">{entry.sourcePlatform}</strong></span>
                  <span>Cập nhật: {new Date(entry.updatedAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Thêm / Chỉnh Sửa Kiến Thức Của App Giả Lập */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 p-6 sm:p-8 space-y-4 text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                  {editingEntryId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {editingEntryId
                    ? 'Chỉnh Sửa Kiến Thức Của App Giả Lập'
                    : 'Thêm Kiến Thức Lỗi & Giải Thích Chi Tiết Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Tiêu đề lỗi phát sinh / Quy tắc tri thức *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tắc đầu phun do Heat Creep khi in PLA đóng kín buồng nhiệt..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Danh mục</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold cursor-pointer"
                  >
                    <option value="simulator_defect_learning">🧠 Học lỗi giả lập 3D</option>
                    <option value="troubleshooting">🛠️ Khắc phục lỗi in</option>
                    <option value="slicer_tuning">⚡ Tinh chỉnh Bambu/Orca</option>
                    <option value="vietnam_environment">🇻🇳 Khí hậu Việt Nam</option>
                    <option value="material_benchmark">🧪 Định mức nhựa</option>
                    <option value="printer_hardware">⚙️ Phần cứng máy in</option>
                    <option value="commercial_practice">🏭 Vận hành xưởng in</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Mã loại lỗi (Defect Type)</label>
                  <select
                    value={newDefectType}
                    onChange={(e) => setNewDefectType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono cursor-pointer"
                  >
                    <option value="overhang">overhang (Sập vách nghiêng)</option>
                    <option value="warping">warping (Cong vênh tróc đế)</option>
                    <option value="stringing">stringing (Tơ nhện kéo sợi)</option>
                    <option value="clogging">clogging (Tắc nghẽn Heat Creep)</option>
                    <option value="under_extrusion">under_extrusion (Thiếu nhựa / Hụt dòng)</option>
                    <option value="elephant_foot">elephant_foot (Chân voi bè đáy)</option>
                    <option value="pillowing">pillowing (Phồng rộp lớp nóc)</option>
                    <option value="ringing">ringing (Rung gợn sóng Ghosting)</option>
                    <option value="delamination">delamination (Nứt tách lớp ngang)</option>
                    <option value="z_seam_scarring">z_seam_scarring (Sẹo đường nối Z-Seam)</option>
                    <option value="bridging">bridging (Võng cầu nối ngang)</option>
                    <option value="support_fusion">support_fusion (Support dính chết vào mẫu)</option>
                    <option value="knock_over">knock_over (Quệt đầu phun đổ mẫu)</option>
                    <option value="moisture_bubbling">moisture_bubbling (Nổ bọt khí do ẩm)</option>
                    <option value="custom_defect">custom_defect (Lỗi thực tế khác)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Loại nhựa áp dụng</label>
                  <input
                    type="text"
                    placeholder="PLA, PETG, ABS, TPU, all"
                    value={newFilaments}
                    onChange={(e) => setNewFilaments(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">1. Hiện tượng lỗi thực tế trên bản in *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Mô tả dấu hiệu nhận biết bằng mắt thường hoặc âm thanh máy in..."
                  value={newProblem}
                  onChange={(e) => setNewProblem(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">2. Giải thích chi tiết nguyên nhân gốc rễ (Vật lý / Nhiệt học / Cơ khí) *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Giải thích tại sao thông số hiện tại lại dẫn tới lỗi này để hệ thống học và giải thích cho người dùng..."
                  value={newRootCause}
                  onChange={(e) => setNewRootCause(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">3. Giải pháp khắc phục &amp; Hướng dẫn tối ưu *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Hướng dẫn cụ thể các thông số Bambu Studio cần điều chỉnh..."
                  value={newSolution}
                  onChange={(e) => setNewSolution(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              {/* Điều kiện kích hoạt tự động trên Simulator */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">
                  4. Điều kiện thông số để App Giả Lập tự động phát hiện (Tùy chọn)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Tên biến (VD: printSpeed, bedTemp)"
                    value={newTriggerParam}
                    onChange={(e) => setNewTriggerParam(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-mono"
                  />
                  <select
                    value={newTriggerOperator}
                    onChange={(e) => setNewTriggerOperator(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-mono"
                  >
                    <option value=">">&gt; (Lớn hơn)</option>
                    <option value="<">&lt; (Nhỏ hơn)</option>
                    <option value=">=">&gt;= (Lớn hơn hoặc bằng)</option>
                    <option value="<=">&lt;= (Nhỏ hơn hoặc bằng)</option>
                    <option value="==">== (Bằng)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Ngưỡng (VD: 250)"
                    value={newTriggerThreshold}
                    onChange={(e) => setNewTriggerThreshold(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  5. Cấu hình Tự Động Sửa (Auto-Fix Patch / Bambu Override JSON)
                </label>
                <textarea
                  rows={3}
                  value={newOverridesJson}
                  onChange={(e) => setNewOverridesJson(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-mono"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsVerified}
                  onChange={(e) => setNewIsVerified(e.target.checked)}
                  className="accent-cyan-600 w-4 h-4"
                />
                <span className="font-bold text-slate-800">
                  Kích hoạt quy tắc này ngay vào bộ não chẩn đoán của 3D PrintSim Pro
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Đang Lưu...' : editingEntryId ? 'Lưu Chỉnh Sửa' : 'Lưu Vào Kho Tri Thức'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
