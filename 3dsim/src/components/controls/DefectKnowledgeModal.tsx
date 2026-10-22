import React, { useState, useEffect } from 'react';
import {
  ISimulationProfile,
  DefectCategoryType,
} from '@/types/simulator';
import {
  ICustomDefectKnowledgeRule,
  fetchLearnedDefectRulesFromDB,
  setLearnedDefectRules,
} from '@/services/preflightAnalyzer';
import {
  IconCheckShield,
  IconClose,
  IconSliders,
  IconTerminal,
} from '@/components/icons/MinimalIcons';

interface DefectKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: ISimulationProfile;
  onRulesUpdated: (rules: ICustomDefectKnowledgeRule[]) => void;
  onApplyFix?: (patch: Partial<ISimulationProfile>) => void;
}

const DEFECT_TYPES: { id: DefectCategoryType; label: string }[] = [
  { id: 'overhang', label: 'Overhang / Sập gãy cành & Đùn mì Ý (Spaghetti)' },
  { id: 'warping', label: 'Warping / Cong vênh bốc góc khỏi bàn in' },
  { id: 'stringing', label: 'Stringing / Tơ mạng nhện & Rỉ nhựa đầu kim' },
  { id: 'under_extrusion', label: 'Under-Extrusion / Hụt dòng nhựa, rỗ xốp lớp' },
  { id: 'elephant_foot', label: 'Elephant Foot / Phình chân voi lớp đáy' },
  { id: 'first_layer', label: 'First Layer / Bong tróc lớp đầu tiên' },
  { id: 'pillowing', label: 'Pillowing / Phồng rỗ & thủng lỗ mặt đỉnh' },
  { id: 'ringing', label: 'Ringing & Ghosting / Gợn sóng bóng ma trên vách' },
  { id: 'delamination', label: 'Delamination / Nứt toác & tách lớp thân giữa' },
  { id: 'z_seam_scarring', label: 'Z-Seam Scarring / Nổi mụn & sẹo dọc đường nối' },
  { id: 'bridging', label: 'Bridging / Võng sợi bắc cầu ngang' },
  { id: 'clogging', label: 'Nozzle Clogging / Tắc kim phun & Heat Creep' },
  { id: 'support_fusion', label: 'Support Fusion / Dính chết Support vào mẫu' },
  { id: 'knock_over', label: 'Knock-Over / Đầu phun quẹt đổ mẫu cao mảnh' },
  { id: 'moisture_bubbling', label: 'Moisture Bubbling / Nhựa ẩm nổ bọt khí' },
  { id: 'temperature_mismatch', label: 'Temperature Mismatch / Sai lệch nhiệt độ vật liệu' },
  { id: 'custom_defect', label: 'Custom Defect / Lỗi thực tế khác từ xưởng in' },
];

export function DefectKnowledgeModal({
  isOpen,
  onClose,
  currentProfile,
  onRulesUpdated,
  onApplyFix,
}: DefectKnowledgeModalProps) {
  const [activeTab, setActiveTab] = useState<'submit' | 'database' | 'login'>('submit');
  const [rules, setRules] = useState<ICustomDefectKnowledgeRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // User / Admin Session State
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username?: string;
    displayName: string;
    role: string;
  } | null>(null);
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Form nhập lỗi mới từ người dùng
  const [title, setTitle] = useState('');
  const [defectType, setDefectType] = useState<DefectCategoryType>('overhang');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [triggerCondition, setTriggerCondition] = useState('');
  const [explanation, setExplanation] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [includeCurrentProfileFix, setIncludeCurrentProfileFix] = useState(true);

  // Admin Edit State
  const [editingRule, setEditingRule] = useState<ICustomDefectKnowledgeRule | null>(null);

  const loadSessionAndRules = async () => {
    setLoading(true);
    try {
      const savedUid = localStorage.getItem('laymor_session_uid') || '';
      const authRes = await fetch('/api/auth/me', {
        headers: savedUid ? { 'x-laymor-uid': savedUid } : {},
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.user) {
          setCurrentUser(authData.user);
        } else {
          setCurrentUser(null);
        }
      }
    } catch {
      // ignore
    }

    const fetched = await fetchLearnedDefectRulesFromDB();
    setRules(fetched);
    onRulesUpdated(fetched);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadSessionAndRules();
      if (!triggerCondition) {
        setTriggerCondition(
          `${currentProfile.material} • Nozzle ${currentProfile.nozzleTemp}°C • Bed ${currentProfile.bedTemp}°C • Speed ${currentProfile.printSpeed}mm/s`
        );
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'hlcai_admin';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          identifier: loginId.trim(),
          password: loginPass,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        setLoginError(data.error || 'Sai ID hoặc mật khẩu');
        return;
      }
      localStorage.setItem('laymor_session_uid', data.user.id);
      localStorage.setItem('laymor_session_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setLoginPass('');
      setStatusMsg(`✓ Đã đăng nhập: ${data.user.displayName} (${data.user.role.toUpperCase()})`);
      setActiveTab('database');
    } catch (err: any) {
      setLoginError(err.message || 'Lỗi kết nối máy chủ');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    }).catch(() => {});
    localStorage.removeItem('laymor_session_uid');
    localStorage.removeItem('laymor_session_user');
    setCurrentUser(null);
    setStatusMsg('Đã đăng xuất tài khoản.');
  };

  const handleSubmitDefect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !explanation.trim()) return;

    setLoading(true);
    setStatusMsg(null);

    const autoFixPatch: Partial<ISimulationProfile> | undefined = includeCurrentProfileFix
      ? {
          layerHeight: currentProfile.layerHeight,
          printSpeed: currentProfile.printSpeed,
          nozzleTemp: currentProfile.nozzleTemp,
          bedTemp: currentProfile.bedTemp,
          supportMode: currentProfile.supportMode,
          brimEnabled: currentProfile.brimEnabled,
          brimWidthMm: currentProfile.brimWidthMm,
          retractionDistanceMm: currentProfile.retractionDistanceMm,
          coolingFanSpeed: currentProfile.coolingFanSpeed,
        }
      : undefined;

    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category: 'simulator_defect_learning',
          defectType,
          severity,
          triggerCondition:
            triggerCondition.trim() ||
            `${currentProfile.material} @ ${currentProfile.nozzleTemp}°C`,
          content: explanation.trim(),
          tags: [
            currentProfile.material,
            defectType,
            ...tagsInput
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
          ],
          autoFixPatch,
          submittedBy: currentUser?.username || currentUser?.displayName || 'Người dùng 3DSim',
          isAdmin,
        }),
      });
      const data = await res.json();
      if (res.ok && data.entry) {
        const updated = await fetchLearnedDefectRulesFromDB();
        setRules(updated);
        setLearnedDefectRules(updated);
        onRulesUpdated(updated);
        setTitle('');
        setExplanation('');
        setStatusMsg(
          '✓ Đã gửi dữ liệu lỗi & giải thích chi tiết về Database! App giả lập đã học thêm quy tắc mới.'
        );
        setActiveTab('database');
      } else {
        setStatusMsg(data.error || 'Không thể lưu dữ liệu lỗi.');
      }
    } catch (err: any) {
      setStatusMsg('Lỗi kết nối: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdminEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRule.id,
          title: editingRule.title,
          defectType: editingRule.defectType,
          severity: editingRule.severity,
          triggerCondition: editingRule.triggerCondition,
          content: editingRule.content,
          tags: editingRule.tags,
          isVerified: editingRule.isVerified,
        }),
      });
      if (res.ok) {
        const updated = await fetchLearnedDefectRulesFromDB();
        setRules(updated);
        setLearnedDefectRules(updated);
        onRulesUpdated(updated);
        setEditingRule(null);
        setStatusMsg('✓ Admin đã cập nhật kiến thức lỗi giả lập thành công!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerify = async (rule: ICustomDefectKnowledgeRule) => {
    if (!isAdmin) return;
    const res = await fetch('/api/knowledge', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: rule.id,
        isVerified: !rule.isVerified,
      }),
    });
    if (res.ok) {
      const updated = await fetchLearnedDefectRulesFromDB();
      setRules(updated);
      setLearnedDefectRules(updated);
      onRulesUpdated(updated);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!isAdmin) return;
    const res = await fetch(`/api/knowledge?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const updated = await fetchLearnedDefectRulesFromDB();
      setRules(updated);
      setLearnedDefectRules(updated);
      onRulesUpdated(updated);
      setStatusMsg('✓ Đã xóa quy tắc lỗi khỏi Knowledge Database.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl glass-panel p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b studio-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl studio-gold-badge flex items-center justify-center">
              <IconCheckShield size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold studio-text-primary uppercase tracking-wider">
                Cơ Sở Tri Thức Lỗi In 3D &amp; Huấn Luyện AI Giả Lập
              </h2>
              <p className="text-xs studio-text-secondary">
                Đóng góp lỗi thực tế kèm giải thích chi tiết để tối ưu bộ giả lập • Admin toàn quyền chỉnh sửa tri thức
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl studio-card hover:bg-[var(--bg-hover)] studio-text-secondary hover:studio-text-primary transition-all cursor-pointer"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Top Bar: Tabs & Active Account Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl studio-card">
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'submit' ? 'studio-pill-active' : 'studio-pill-inactive'
              }`}
            >
              + Nhập Lỗi &amp; Giải Thích Mới
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'database' ? 'studio-pill-active' : 'studio-pill-inactive'
              }`}
            >
              Kho Kiến Thức Đã Học ({rules.length})
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'login' ? 'studio-pill-active' : 'studio-pill-inactive'
              }`}
            >
              {currentUser
                ? `Tài khoản: ${currentUser.username || currentUser.displayName} (${currentUser.role.toUpperCase()})`
                : 'Đăng nhập Admin / User'}
            </button>
          </div>

          {isAdmin && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-[10px] font-mono font-bold uppercase">
              ★ Quyền Master Admin (Toàn quyền sửa/xóa tri thức)
            </span>
          )}
        </div>

        {statusMsg && (
          <div className="p-3 rounded-xl studio-gold-badge text-xs font-semibold flex items-center justify-between">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg(null)} className="text-[10px] underline ml-2">
              Đóng
            </button>
          </div>
        )}

        {/* TAB 1: NHẬP LỖI & GIẢI THÍCH TỪ NGƯỜI DÙNG */}
        {activeTab === 'submit' && (
          <form onSubmit={handleSubmitDefect} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold studio-text-primary block">
                  Tên hiện tượng lỗi phát sinh *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Nhựa PETG bị kéo tơ & vón cục đen ở lớp vỏ nghiêng..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold studio-text-primary block">
                  Nhóm lỗi kỹ thuật (Defect Category)
                </label>
                <select
                  value={defectType}
                  onChange={(e) => setDefectType(e.target.value as DefectCategoryType)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs cursor-pointer"
                >
                  {DEFECT_TYPES.map((dt) => (
                    <option key={dt.id} value={dt.id} className="bg-neutral-900 text-neutral-100">
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold studio-text-primary block">Mức độ rủi ro</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs cursor-pointer"
                >
                  <option value="critical" className="bg-neutral-900">Nghiêm trọng (Critical - Hỏng mẫu)</option>
                  <option value="high" className="bg-neutral-900">Cao (High - Sai lệch kết cấu)</option>
                  <option value="medium" className="bg-neutral-900">Trung bình (Medium - Lỗi thẩm mỹ)</option>
                  <option value="low" className="bg-neutral-900">Thấp (Low - Lưu ý nhỏ)</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-semibold studio-text-primary flex items-center justify-between">
                  <span>Điều kiện thông số phát sinh lỗi (Trigger Condition)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setTriggerCondition(
                        `${currentProfile.material} • Nozzle ${currentProfile.nozzleTemp}°C • Bed ${currentProfile.bedTemp}°C • Speed ${currentProfile.printSpeed}mm/s • Layer ${currentProfile.layerHeight}mm`
                      )
                    }
                    className="text-[10px] studio-text-gold hover:underline cursor-pointer"
                  >
                    Lấy từ Profile hiện tại
                  </button>
                </label>
                <input
                  type="text"
                  value={triggerCondition}
                  onChange={(e) => setTriggerCondition(e.target.value)}
                  placeholder="VD: Khi in PETG nhiệt độ > 255°C và Retraction < 0.6mm..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold studio-text-primary block">
                Giải thích chi tiết nguyên nhân &amp; cách khắc phục thực tế *
              </label>
              <textarea
                rows={4}
                required
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Mô tả rõ hiện tượng gặp phải trên máy in, nguyên nhân vật lý/nhiệt học và thông số Bambu Studio cần chỉnh để khắc phục triệt để..."
                className="w-full px-3 py-2 rounded-xl glass-input text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="space-y-1">
                <label className="font-semibold studio-text-primary block">
                  Từ khóa nhận diện (cách nhau dấu phẩy)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="VD: PETG, stringing, nozzle_temp, bambu_x1c"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <label className="p-3 rounded-xl studio-card flex items-center justify-between cursor-pointer mt-2 sm:mt-4">
                <div>
                  <div className="font-semibold studio-text-primary text-[11px]">
                    Đính kèm Profile hiện tại làm Bản Vá Tự Động
                  </div>
                  <div className="text-[10px] studio-text-secondary">
                    Lưu thông số đang mở ({currentProfile.material} {currentProfile.layerHeight}mm, {currentProfile.nozzleTemp}°C)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeCurrentProfileFix}
                  onChange={(e) => setIncludeCurrentProfileFix(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent-gold)] rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl studio-cta-primary font-bold text-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Đang đồng bộ Database...' : 'Gửi Vào Bộ Nhớ Học Tập Của App →'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: DANH SÁCH TRI THỨC LỖI & QUẢN TRỊ ADMIN */}
        {activeTab === 'database' && (
          <div className="space-y-3 text-xs">
            {editingRule && isAdmin && (
              <form
                onSubmit={handleSaveAdminEdit}
                className="p-4 rounded-xl border border-[var(--accent-gold)] bg-[var(--bg-subtle)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold studio-text-gold uppercase text-[11px]">
                    ✎ Chỉnh sửa Tri Thức Giả Lập (Quyền Admin): {editingRule.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingRule(null)}
                    className="text-[11px] studio-text-secondary hover:studio-text-primary"
                  >
                    Hủy
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={editingRule.title}
                    onChange={(e) => setEditingRule({ ...editingRule, title: e.target.value })}
                    className="px-3 py-1.5 rounded-lg glass-input text-xs font-semibold"
                  />
                  <input
                    type="text"
                    value={editingRule.triggerCondition || ''}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, triggerCondition: e.target.value })
                    }
                    placeholder="Điều kiện kích hoạt"
                    className="px-3 py-1.5 rounded-lg glass-input text-xs font-mono"
                  />
                </div>

                <textarea
                  rows={3}
                  value={editingRule.content}
                  onChange={(e) => setEditingRule({ ...editingRule, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingRule.isVerified}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, isVerified: e.target.checked })
                      }
                      className="w-4 h-4 accent-[var(--accent-gold)]"
                    />
                    <span className="text-[11px] studio-text-primary font-semibold">
                      Kích hoạt áp dụng vào bộ kiểm lỗi 3D PrintSim
                    </span>
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg studio-cta-primary font-bold text-xs cursor-pointer"
                  >
                    Lưu Thay Đổi Admin
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl studio-card space-y-2 border studio-border"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          r.isVerified
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {r.isVerified ? 'Đang Áp Dụng' : 'Chờ Duyệt'}
                      </span>
                      <span className="px-2 py-0.5 rounded studio-gold-badge text-[9px] font-mono uppercase">
                        {r.defectType || r.category}
                      </span>
                      <h4 className="font-bold studio-text-primary text-xs">{r.title}</h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {r.autoFixPatch && onApplyFix && (
                        <button
                          onClick={() => {
                            onApplyFix(r.autoFixPatch!);
                            setStatusMsg(`✓ Đã nạp thông số khắc phục từ mục "${r.title}"!`);
                          }}
                          className="px-2.5 py-1 rounded-lg studio-gold-badge text-[10px] font-semibold cursor-pointer flex items-center gap-1"
                        >
                          <IconSliders size={11} />
                          <span>Nạp Fix</span>
                        </button>
                      )}

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleToggleVerify(r)}
                            className="px-2 py-1 rounded-lg studio-card hover:bg-[var(--bg-hover)] text-[10px] font-semibold cursor-pointer"
                          >
                            {r.isVerified ? 'Tắt Học' : 'Duyệt Học'}
                          </button>
                          <button
                            onClick={() => setEditingRule(r)}
                            className="px-2 py-1 rounded-lg studio-card hover:bg-[var(--bg-hover)] studio-text-gold text-[10px] font-semibold cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteRule(r.id)}
                            className="px-2 py-1 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 text-[10px] font-semibold cursor-pointer"
                          >
                            Xóa
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {r.triggerCondition && (
                    <div className="text-[10px] font-mono studio-text-gold">
                      Điều kiện: {r.triggerCondition}
                    </div>
                  )}

                  <p className="text-[11px] studio-text-secondary leading-relaxed">{r.content}</p>

                  <div className="flex items-center justify-between text-[10px] studio-text-muted pt-1 border-t studio-border">
                    <span>Đóng góp bởi: {r.submittedBy || 'Kỹ sư Laymor 3D'}</span>
                    <span>Cập nhật: {r.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ĐĂNG NHẬP TÀI KHOẢN ADMIN / USER TRỰC TIẾP TRONG 3DSIM */}
        {activeTab === 'login' && (
          <div className="p-4 rounded-xl studio-card space-y-4 text-xs">
            {currentUser ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold studio-text-primary">
                    Đang đăng nhập: {currentUser.displayName} ({currentUser.username || currentUser.id})
                  </div>
                  <div className="text-xs studio-text-secondary">
                    Vai trò hệ thống:{' '}
                    <strong className="studio-text-gold uppercase">{currentUser.role}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <a
                      href="/admin"
                      target="_top"
                      className="px-3.5 py-2 rounded-xl studio-gold-badge font-bold text-xs"
                    >
                      Mở Trung Tâm Admin (/admin) →
                    </a>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold text-xs cursor-pointer"
                  >
                    Đăng Xuất
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3 max-w-md mx-auto">
                <div className="flex items-center gap-2 studio-text-gold font-bold">
                  <IconTerminal size={14} />
                  <span>Đăng Nhập Tài Khoản Laymor 3D / Master Admin</span>
                </div>
                <p className="text-[11px] studio-text-secondary">
                  Đăng nhập bằng tài khoản được cấp hoặc tài khoản Master Admin để chỉnh sửa và phê duyệt kho kiến thức lỗi giả lập.
                </p>

                {loginError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-semibold">
                    {loginError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold studio-text-primary block">
                    ID Tài Khoản / Username
                  </label>
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Nhập ID (VD: hlcai_admin)"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold studio-text-primary block">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl studio-cta-primary font-bold text-xs cursor-pointer"
                >
                  Đăng Nhập Hệ Thống
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
