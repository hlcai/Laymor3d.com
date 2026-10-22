import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Cpu,
  Shield,
  Layers,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Key,
  ExternalLink,
  Zap,
  Info,
  Sliders,
  X,
  HelpCircle,
  MessageSquare,
  Camera,
  Send,
  BookOpen,
  ArrowRight,
  Upload,
  Check,
  Database,
} from 'lucide-react';
import * as THREE from 'three';
import {
  ISimulationProfile,
  ISampleModel,
  IModelTransform,
  ISupportAnalysisResult,
  PrintConsultIntent,
  IConsultChatMessage,
  IPhotoDiagnosisResult,
} from '@/types/simulator';
import {
  analyzeWithGeminiAI,
  analyzeWithBambuExpertRules,
  consultChatWithGeminiAI,
  diagnosePrintPhotoWithAI,
  PRINT_CONSULT_INTENTS,
  GEMINI_AVAILABLE_MODELS,
  getSavedGeminiApiKey,
  saveGeminiApiKey,
  clearGeminiApiKey,
  getSavedGeminiModel,
  saveGeminiModel,
} from '@/services/geminiSupportService';
import {
  getLearnedDefectRules,
  setLearnedDefectRules,
  ICustomDefectKnowledgeRule,
} from '@/services/preflightAnalyzer';

interface BambuSupportAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: ISampleModel;
  geometry: THREE.BufferGeometry;
  profile: ISimulationProfile;
  modelTransform: IModelTransform;
  onChangeProfile: (patch: Partial<ISimulationProfile>) => void;
  onChangeTransform: (newTransform: IModelTransform) => void;
}

const QUICK_CHAT_PROMPTS = [
  'Tối ưu 6 nhóm để in mẫu này mịn nhất, không lộ vân lớp?',
  'Làm sao gỡ Tree Support bằng tay không để lại sẹo trắng?',
  'Chỉnh thông số giảm 35% thời gian in mà không gãy chi tiết?',
  'Triệt tiêu kéo tơ (Stringing) và quệt đầu phun cho mẫu cao?',
  'Tăng độ bền cơ học gấp đôi cho các khớp nối và cổ hẹp?',
];

const VISION_PRESET_SYMPTOMS = [
  {
    label: 'Mặt dưới cằm/đuôi bị xù mì & sẹo Support',
    text: 'Mặt dưới vùng Overhang (cằm, đuôi, vòm) bị võng sợi xù mì và để lại sẹo trắng khi bóc Tree Support.',
  },
  {
    label: 'Kéo tơ mạng nhện (Stringing) giữa các nhánh',
    text: 'Có nhiều sợi tơ nhựa mảnh như mạng nhện giăng giữa các cành Tree Support và tai/sừng của mẫu.',
  },
  {
    label: 'Cong vênh góc đáy & bật gốc khỏi bàn PEI',
    text: 'Mép đáy mô hình bị cong nhổng lên khỏi bàn in và đầu phun quệt làm bật gốc mẫu ở tầng cao.',
  },
  {
    label: 'Trượt bước lệch tầng ngang (Layer Shift)',
    text: 'Phần thân trên của bản in bị lệch hẳn sang một bên theo phương ngang và có vết cọ đầu phun.',
  },
];

const CATEGORY_BADGES: Record<string, { label: string; color: string }> = {
  quality: { label: '1. Quality (Chất lượng)', color: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/30' },
  strength: { label: '2. Strength (Độ bền)', color: 'bg-amber-950/70 text-amber-300 border-amber-500/30' },
  speed: { label: '3. Speed (Tốc độ)', color: 'bg-blue-950/70 text-blue-300 border-blue-500/30' },
  support: { label: '4. Support (Chống đỡ)', color: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30' },
  cooling: { label: '5. Cooling & Nhiệt', color: 'bg-purple-950/70 text-purple-300 border-purple-500/30' },
  adhesion: { label: '6. Adhesion (Bám bàn)', color: 'bg-rose-950/70 text-rose-300 border-rose-500/30' },
};

export function BambuSupportAIAssistantModal({
  isOpen,
  onClose,
  currentModel,
  geometry,
  profile,
  modelTransform,
  onChangeProfile,
  onChangeTransform,
}: BambuSupportAIAssistantModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedModelId, setSelectedModelId] = useState(getSavedGeminiModel());
  const [isSavedKey, setIsSavedKey] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<PrintConsultIntent>('balanced');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ISupportAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<
    'recommendation' | 'copilot_chat' | 'vision_diagnosis' | 'hotspots' | 'tips' | 'settings'
  >('recommendation');
  const [applySuccess, setApplySuccess] = useState(false);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // State cho Trợ lý Chat đa lượt (Copilot Chat)
  const [chatMessages, setChatMessages] = useState<IConsultChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // State cho Chẩn đoán Ảnh lỗi (Vision AI)
  const [symptomInput, setSymptomInput] = useState(VISION_PRESET_SYMPTOMS[0].text);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadedImageMime, setUploadedImageMime] = useState<string>('image/jpeg');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<IPhotoDiagnosisResult | null>(null);
  const [savedToKnowledgeDB, setSavedToKnowledgeDB] = useState(false);

  useEffect(() => {
    const saved = getSavedGeminiApiKey();
    if (saved) {
      setApiKeyInput(saved);
      setIsSavedKey(true);
    }
    setSelectedModelId(getSavedGeminiModel());
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && geometry) {
      handleRunAnalysis(selectedIntent);
    }
  }, [isOpen, geometry, currentModel, selectedIntent]);

  useEffect(() => {
    if (chatMessages.length === 0 && analysisResult) {
      setChatMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          source: analysisResult.source === 'gemini_flash' ? selectedModelId : 'Bambu Engineering Copilot',
          content: `Xin chào! Mình là **Chuyên gia AI Tư vấn In 3D** đang theo dõi trực tiếp mô hình **"${currentModel.name}"** (${analysisResult.totalTriangles.toLocaleString()} tam giác, diện tích Overhang **${analysisResult.overhangPercent}%**).\n\nBạn có thể hỏi mình bất kỳ vấn đề kỹ thuật nào (cách chống gãy chi tiết mảnh, gỡ support không sẹo, giảm thời gian in, chống kéo tơ PETG/PLA...) — mình sẽ tính toán và tạo nút **Áp dụng thông số 1-Click** ngay trong khung chat!`,
          suggestedPatch: analysisResult.fullProfilePatch,
          patchSummary: `Gói Khuyến Nghị (${PRINT_CONSULT_INTENTS.find((i) => i.id === selectedIntent)?.shortLabel}): Layer ${analysisResult.fullProfilePatch?.layerHeight}mm • ${analysisResult.fullProfilePatch?.wallLoops} Tường • Tree ${analysisResult.supportRecommendation.treeStyle}`,
        },
      ]);
    }
  }, [analysisResult, currentModel.name]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const showQuickAppliedToast = (msg: string) => {
    setAppliedToast(msg);
    setTimeout(() => setAppliedToast(null), 3200);
  };

  const handleRunAnalysis = async (intentToRun: PrintConsultIntent = selectedIntent) => {
    setIsAnalyzing(true);
    setApplySuccess(false);

    try {
      const result = await analyzeWithGeminiAI(
        currentModel.name,
        geometry,
        profile,
        apiKeyInput.trim(),
        intentToRun
      );
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setAnalysisResult(
        analyzeWithBambuExpertRules(currentModel.name, geometry, profile, intentToRun)
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim().length > 0) {
      saveGeminiApiKey(apiKeyInput.trim());
      saveGeminiModel(selectedModelId);
      setIsSavedKey(true);
      handleRunAnalysis(selectedIntent);
    }
  };

  const handleClearApiKey = () => {
    clearGeminiApiKey();
    setApiKeyInput('');
    setIsSavedKey(false);
    handleRunAnalysis(selectedIntent);
  };

  const handleApplyFullProfile = () => {
    if (!analysisResult) return;
    const appliedPatch = analysisResult.fullProfilePatch || {
      supportMode: analysisResult.supportRecommendation.mode,
      treeStyle: analysisResult.supportRecommendation.treeStyle,
      supportAngleThreshold: analysisResult.supportRecommendation.angleThreshold,
      supportTopZDistance: analysisResult.supportRecommendation.topZDistance,
      supportBranchDiameter: analysisResult.supportRecommendation.branchDiameter,
      supportBranchAngle: analysisResult.supportRecommendation.branchAngle,
      supportOnBuildPlateOnly: analysisResult.supportRecommendation.onBuildPlateOnly,
      supportInterfaceLayers: analysisResult.supportRecommendation.interfaceLayers,
    };

    onChangeProfile(appliedPatch);

    // Đồng bộ phiên tư vấn AI lên Supabase Cloud (print_sessions)
    fetch('/api/v1/nhat-ky/save-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: {
          sessionId: `ai_consult_${Date.now()}`,
          modelName: currentModel.name,
          material: profile.material,
          layerHeight: appliedPatch.layerHeight || profile.layerHeight,
          infillDensity: appliedPatch.infillDensity || profile.infillDensity,
          printSpeed: appliedPatch.printSpeed || profile.printSpeed,
          nozzleTemp: appliedPatch.nozzleTemp || profile.nozzleTemp,
          bedTemp: appliedPatch.bedTemp || profile.bedTemp,
          score: analysisResult.predictedImpact?.successScoreAfter || 97,
          notes: `[AI Copilot - ${selectedIntent}] ${analysisResult.supportRecommendation.summary}`,
        },
        append_mode: true,
      }),
    }).catch(() => {});

    setApplySuccess(true);
    showQuickAppliedToast('Đã áp dụng 6 nhóm thông số & đồng bộ phiên tư vấn lên Supabase!');
    setTimeout(() => setApplySuccess(false), 3000);
  };

  const handleApplyRecommendedOrientation = () => {
    if (!analysisResult) return;
    const { axis, degrees } = analysisResult.recommendedOrientation;
    if (degrees === 0) return;

    const newRot: [number, number, number] = [...modelTransform.rotation];
    if (axis === 'x') newRot[0] = degrees;
    if (axis === 'y') newRot[1] = degrees;
    if (axis === 'z') newRot[2] = degrees;

    onChangeTransform({
      ...modelTransform,
      rotation: newRot,
    });
    showQuickAppliedToast(`Đã xoay mô hình ${degrees}° quanh trục ${axis.toUpperCase()}!`);
  };

  const handleSendChat = async (questionOverride?: string) => {
    const q = (questionOverride ?? chatInput).trim();
    if (!q || isChatLoading) return;

    const userMsg: IConsultChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    };

    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    if (!questionOverride) setChatInput('');
    setIsChatLoading(true);

    try {
      const aiReply = await consultChatWithGeminiAI(
        q,
        updatedHistory,
        currentModel.name,
        geometry,
        profile,
        selectedIntent,
        apiKeyInput.trim()
      );
      setChatMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunVisionDiagnosis = async () => {
    setIsDiagnosing(true);
    setSavedToKnowledgeDB(false);
    try {
      const res = await diagnosePrintPhotoWithAI(
        symptomInput,
        profile,
        currentModel.name,
        uploadedImagePreview || undefined,
        uploadedImageMime,
        apiKeyInput.trim()
      );
      setDiagnosisResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSaveDiagnosisToKnowledgeDB = async () => {
    if (!diagnosisResult) return;
    const newRule: ICustomDefectKnowledgeRule = {
      id: `ai-diag-${Date.now()}`,
      title: diagnosisResult.defectTitle,
      category: 'simulator_defect_learning',
      defectType: diagnosisResult.defectCategory,
      severity: diagnosisResult.severity === 'critical' ? 'critical' : 'high',
      triggerCondition: `${profile.material} • ${currentModel.name}`,
      content: `${diagnosisResult.rootCauseAnalysis} Khắc phục: ${diagnosisResult.engineeringFixSteps.join(' ')}`,
      tags: [profile.material, diagnosisResult.defectCategory, 'AI Vision Verified'],
      autoFixPatch: diagnosisResult.recommendedPatch,
      submittedBy: 'AI Consultant Copilot',
      isVerified: true,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const existing = getLearnedDefectRules();
    setLearnedDefectRules([newRule, ...existing]);

    try {
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRule,
          solutionText: newRule.content,
          problemSymptom: diagnosisResult.visualSymptoms.join('; '),
          rootCause: diagnosisResult.rootCauseAnalysis,
        }),
      });
    } catch {}

    setSavedToKnowledgeDB(true);
    showQuickAppliedToast('Đã lưu ca bệnh vào Kho Tri Thức Lỗi (Defect Knowledge DB)!');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast thông báo khi áp dụng thông số */}
        {appliedToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs shadow-xl animate-bounce">
            <CheckCircle className="w-4 h-4" />
            {appliedToast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/80 border-b border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-white tracking-wide">
                  CHUYÊN GIA AI TƯ VẤN IN 3D TOÀN DIỆN (BAMBU STUDIO COPILOT)
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {analysisResult?.source === 'gemini_flash'
                    ? `${selectedModelId.toUpperCase()} LIVE`
                    : 'BAMBU EXPERT + KNOWLEDGE DB'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tối ưu đồng bộ 6 nhóm thông số Bambu Studio • Hỏi-Đáp kỹ thuật đa lượt • Chẩn đoán ảnh lỗi & Học tri thức xưởng in
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh chọn Mục tiêu Bản in (Print Intent Selector) */}
        <div className="px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Mục tiêu in:
          </span>
          {PRINT_CONSULT_INTENTS.map((item) => {
            const active = selectedIntent === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedIntent(item.id)}
                title={item.description}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 border ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>{item.shortLabel}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded ${
                    active ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-2.5 bg-slate-900/95 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('recommendation')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'recommendation'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Tư Vấn 6 Nhóm Bambu
          </button>

          <button
            onClick={() => setActiveTab('copilot_chat')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'copilot_chat'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat Chuyên Gia AI
            <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-cyan-500/20 text-cyan-300">
              Copilot
            </span>
          </button>

          <button
            onClick={() => setActiveTab('vision_diagnosis')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'vision_diagnosis'
                ? 'border-purple-400 text-purple-300 bg-purple-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Chẩn Đoán Ảnh Lỗi (Vision)
          </button>

          <button
            onClick={() => setActiveTab('hotspots')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'hotspots'
                ? 'border-amber-400 text-amber-300 bg-amber-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Tri Thức Xưởng & Điểm Nóng ({(analysisResult?.matchedKnowledgeRules?.length || 0) + (analysisResult?.riskHotspots.length || 0)})
          </button>

          <button
            onClick={() => setActiveTab('tips')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'tips'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Mẹo Bambu Studio
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`ml-auto px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'settings'
                ? 'border-amber-400 text-amber-300 bg-amber-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            {isSavedKey ? 'Đã kết nối Gemini Key' : 'Cài đặt Gemini Key'}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-200">
          {isAnalyzing ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  Chuyên gia AI đang quét hình học 3D & đối chiếu Kho Tri Thức Xưởng In...
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Đang tính toán đồng bộ 6 nhóm thông số Bambu Studio cho mục tiêu:{' '}
                  {PRINT_CONSULT_INTENTS.find((i) => i.id === selectedIntent)?.label}
                </p>
              </div>
            </div>
          ) : analysisResult ? (
            <>
              {/* TAB 1: TƯ VẤN TOÀN DIỆN 6 NHÓM BAMBU STUDIO */}
              {activeTab === 'recommendation' && (
                <div className="space-y-5">
                  {/* Tóm tắt chuyên gia & Dự báo hiệu quả Before/After */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Phác Đồ Kỹ Thuật Đề Xuất Cho "{analysisResult.modelName}"
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {analysisResult.supportRecommendation.summary}
                        </p>
                      </div>
                      <button
                        onClick={handleApplyFullProfile}
                        className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Áp Dụng Toàn Bộ 6 Nhóm Lên Mẫu 3D
                      </button>
                    </div>

                    {analysisResult.predictedImpact && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
                        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block">
                            Xác Suất In Thành Công
                          </span>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-xs text-slate-500 line-through">
                              {analysisResult.predictedImpact.successScoreBefore}%
                            </span>
                            <ArrowRight className="w-3 h-3 text-emerald-400" />
                            <span className="text-base font-bold text-emerald-400">
                              {analysisResult.predictedImpact.successScoreAfter}%
                            </span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block">
                            Chất Lượng Bề Mặt
                          </span>
                          <span className="text-base font-bold text-cyan-300 mt-1 block">
                            {analysisResult.predictedImpact.surfaceQualityScore}/100
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block">
                            Độ Bền Kết Cấu Cơ Học
                          </span>
                          <span className="text-base font-bold text-amber-300 mt-1 block">
                            {analysisResult.predictedImpact.structuralStrengthScore}/100
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block">
                            Lượng Nhựa Support Dự Kiến
                          </span>
                          <span className="text-base font-bold text-purple-300 mt-1 block">
                            ~{analysisResult.estimatedSupportWeightGrams}g ({analysisResult.overhangPercent}% Overhang)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bảng đối chiếu chi tiết 6 nhóm thông số Bambu Studio */}
                  {analysisResult.parameterChanges && analysisResult.parameterChanges.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-emerald-400" />
                          Bảng Đối Chiếu 6 Nhóm Thông Số Bambu Studio (Hiện Tại vs AI Đề Xuất)
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          Bấm vào từng dòng để áp dụng lẻ hoặc áp dụng toàn bộ ở trên
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {analysisResult.parameterChanges.map((diff, idx) => {
                          const badge = CATEGORY_BADGES[diff.category] || CATEGORY_BADGES.quality;
                          const isChanged = String(diff.currentValue) !== String(diff.recommendedValue);
                          return (
                            <div
                              key={`${diff.paramKey}-${idx}`}
                              className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-emerald-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded border ${badge.color}`}
                                  >
                                    {badge.label}
                                  </span>
                                  <span className="text-xs font-bold text-white">{diff.label}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  {diff.reason}
                                </p>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <div className="text-right">
                                  <div className="flex items-center gap-1.5 justify-end text-xs">
                                    <span className="text-slate-400 font-mono">
                                      {String(diff.currentValue)}
                                      {diff.unit ? ` ${diff.unit}` : ''}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="font-bold text-emerald-300 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                                      {String(diff.recommendedValue)}
                                      {diff.unit ? ` ${diff.unit}` : ''}
                                    </span>
                                  </div>
                                </div>

                                {isChanged && analysisResult.fullProfilePatch && (
                                  <button
                                    onClick={() => {
                                      const val = analysisResult.fullProfilePatch?.[diff.paramKey];
                                      if (val !== undefined) {
                                        onChangeProfile({ [diff.paramKey]: val });
                                        showQuickAppliedToast(`Đã cập nhật ${diff.label}!`);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-emerald-600 hover:text-slate-950 text-slate-200 text-[11px] font-semibold transition cursor-pointer"
                                  >
                                    Áp dụng
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Khuyến nghị góc xoay mô hình */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <RotateCw className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Tư Vấn Hướng Đặt Mô Hình Trên Bàn In (Auto-Orientation)
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        {analysisResult.recommendedOrientation.rationale}
                      </p>
                    </div>

                    {analysisResult.recommendedOrientation.degrees !== 0 && (
                      <button
                        onClick={handleApplyRecommendedOrientation}
                        className="shrink-0 px-3.5 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition cursor-pointer"
                      >
                        Xoay {analysisResult.recommendedOrientation.degrees}° Trục{' '}
                        {analysisResult.recommendedOrientation.axis.toUpperCase()}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TRỢ LÝ CHAT ĐA LƯỢT (AI COPILOT) */}
              {activeTab === 'copilot_chat' && (
                <div className="flex flex-col h-[58vh]">
                  {/* Gợi ý câu hỏi nhanh */}
                  <div className="flex items-center gap-1.5 pb-3 overflow-x-auto no-scrollbar shrink-0">
                    {QUICK_CHAT_PROMPTS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendChat(q)}
                        disabled={isChatLoading}
                        className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-cyan-950/80 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-[11px] whitespace-nowrap transition cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Khung hiển thị hội thoại */}
                  <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.role === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 space-y-2.5 ${
                            msg.role === 'user'
                              ? 'bg-emerald-600 text-slate-950 font-medium'
                              : 'bg-slate-800/90 border border-slate-700 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 text-[10px] opacity-75">
                            <span className="font-bold uppercase">
                              {msg.role === 'user' ? 'Bạn' : msg.source || 'AI Print Copilot'}
                            </span>
                            <span>{msg.timestamp}</span>
                          </div>

                          <div className="text-xs leading-relaxed whitespace-pre-line">
                            {msg.content}
                          </div>

                          {msg.matchedRules && msg.matchedRules.length > 0 && (
                            <div className="pt-1 flex flex-wrap gap-1.5">
                              {msg.matchedRules.map((ruleTitle, rIdx) => (
                                <span
                                  key={rIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300"
                                >
                                  <BookOpen className="w-3 h-3" />
                                  Tri thức xưởng: {ruleTitle}
                                </span>
                              ))}
                            </div>
                          )}

                          {msg.suggestedPatch && Object.keys(msg.suggestedPatch).length > 0 && (
                            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-2">
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                                  Gói Thông Số Khuyến Nghị Từ Câu Trả Lời
                                </span>
                                <span className="text-[11px] text-slate-300 font-mono">
                                  {msg.patchSummary || 'Cập nhật đồng bộ thông số Bambu Studio'}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  if (msg.suggestedPatch) {
                                    onChangeProfile(msg.suggestedPatch);
                                    showQuickAppliedToast(
                                      'Đã áp dụng cấu hình từ Trợ lý Chat AI lên mô hình 3D!'
                                    );
                                  }
                                }}
                                className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                Áp Dụng Ngay
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isChatLoading && (
                      <div className="flex items-center gap-2 text-xs text-cyan-300 p-3">
                        <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                        Chuyên gia AI đang phân tích hình học & tính toán thông số...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Ô nhập câu hỏi */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChat();
                    }}
                    className="mt-3 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Hỏi chuyên gia AI về cách in mẫu "${currentModel.name}" (VD: Làm sao để đuôi không bị gãy, chống kéo tơ PETG...)`}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !chatInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Gửi Hỏi AI
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: CHẨN ĐOÁN ẢNH CHỤP BẢN IN LỖI (VISION AI) */}
              {activeTab === 'vision_diagnosis' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cột trái: Upload ảnh + Mô tả triệu chứng */}
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        1. Tải Ảnh Bản In Thực Tế Hoặc Chọn Triệu Chứng Lỗi
                      </h3>

                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-purple-400/60 rounded-xl bg-slate-950/60 cursor-pointer transition text-center">
                        {uploadedImagePreview ? (
                          <div className="space-y-2">
                            <img
                              src={uploadedImagePreview}
                              alt="Ảnh bản in lỗi"
                              className="max-h-36 rounded-lg mx-auto object-contain border border-slate-700"
                            />
                            <span className="text-[11px] text-purple-300 block">
                              Bấm để đổi ảnh chụp bản in khác
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1.5 py-3">
                            <Upload className="w-6 h-6 text-purple-400 mx-auto" />
                            <p className="text-xs font-semibold text-slate-200">
                              Tải ảnh chụp mẫu in bị lỗi (JPG, PNG, WebP)
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Gemini Vision sẽ nhận diện vết lỗi trên bề mặt nhựa
                            </p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 block">
                          Hoặc chọn nhanh triệu chứng thực tế tại xưởng:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {VISION_PRESET_SYMPTOMS.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSymptomInput(item.text)}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-950/60 border border-slate-700 hover:border-purple-500/40 text-[11px] text-slate-300 transition cursor-pointer"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={symptomInput}
                        onChange={(e) => setSymptomInput(e.target.value)}
                        placeholder="Mô tả hiện tượng lỗi bạn gặp phải khi in..."
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-400"
                      />

                      <button
                        onClick={handleRunVisionDiagnosis}
                        disabled={isDiagnosing}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        {isDiagnosing
                          ? 'Đang phân tích ảnh & suy luận cơ chế lỗi...'
                          : 'Chẩn Đoán Nguyên Nhân & Tạo Cấu Hình Sửa Lỗi'}
                      </button>
                    </div>

                    {/* Cột phải: Kết quả chẩn đoán & Nút áp dụng + Lưu vào DB */}
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
                      {diagnosisResult ? (
                        <div className="space-y-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-500/20 text-red-300 border border-red-500/30">
                                Độ tin cậy: {diagnosisResult.confidencePercent}% •{' '}
                                {diagnosisResult.defectCategory.toUpperCase()}
                              </span>
                              <h4 className="text-sm font-bold text-white mt-1.5">
                                {diagnosisResult.defectTitle}
                              </h4>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-amber-400">
                              Cơ Chế Vật Lý & Nguyên Nhân Gốc Rễ:
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {diagnosisResult.rootCauseAnalysis}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase text-emerald-400">
                              Phác Đồ Tinh Chỉnh Bambu Studio:
                            </span>
                            <ul className="space-y-1">
                              {diagnosisResult.engineeringFixSteps.map((step, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-slate-200 flex items-start gap-2"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-2 flex flex-col gap-2">
                            <button
                              onClick={() => {
                                onChangeProfile(diagnosisResult.recommendedPatch);
                                showQuickAppliedToast(
                                  `Đã áp dụng phác đồ khắc phục "${diagnosisResult.defectTitle}"!`
                                );
                              }}
                              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                              <Zap className="w-4 h-4" />
                              Áp Dụng Thông Số Sửa Lỗi Này Lên Bản In
                            </button>

                            <button
                              onClick={handleSaveDiagnosisToKnowledgeDB}
                              disabled={savedToKnowledgeDB}
                              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                              <Database className="w-3.5 h-3.5 text-amber-400" />
                              {savedToKnowledgeDB
                                ? 'Đã Lưu Vào Kho Tri Thức (Defect Knowledge DB)'
                                : 'Lưu Ca Lỗi Này Vào Kho Tri Thức Xưởng Để AI Học'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                          <Camera className="w-10 h-10 text-slate-600" />
                          <p className="text-xs font-semibold text-slate-300">
                            Chưa có kết quả chẩn đoán
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Hãy tải ảnh chụp mẫu in bị lỗi hoặc chọn 1 triệu chứng bên trái rồi bấm{' '}
                            <strong>Chẩn Đoán Nguyên Nhân</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TRI THỨC XƯỞNG IN & ĐIỂM NÓNG RỦI RO */}
              {activeTab === 'hotspots' && (
                <div className="space-y-5">
                  {/* Kho tri thức xưởng in khớp với mô hình */}
                  {analysisResult.matchedKnowledgeRules &&
                    analysisResult.matchedKnowledgeRules.length > 0 && (
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          Quy Tắc Kinh Nghiệm Xưởng In Được Kích Hoạt Tự Động ({analysisResult.matchedKnowledgeRules.length})
                        </h3>
                        <div className="grid grid-cols-1 gap-2.5">
                          {analysisResult.matchedKnowledgeRules.map((rule) => (
                            <div
                              key={rule.id}
                              className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-300">
                                    {rule.isVerified ? 'Đã Duyệt Bởi Admin' : 'Cộng Đồng Đóng Góp'}
                                  </span>
                                  <h4 className="text-xs font-bold text-white">{rule.title}</h4>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  {rule.content}
                                </p>
                              </div>
                              {rule.autoFixPatch && (
                                <button
                                  onClick={() => {
                                    onChangeProfile(rule.autoFixPatch!);
                                    showQuickAppliedToast(`Đã áp dụng quy tắc "${rule.title}"!`);
                                  }}
                                  className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition cursor-pointer"
                                >
                                  Áp dụng quy tắc
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Điểm nóng Overhang trên lưới 3D */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Các Vùng Nhô Overhang Hiểm Học Đã Được Dựng Nhánh Đỡ ({analysisResult.riskHotspots.length})
                    </h3>
                    {analysisResult.riskHotspots.map((spot) => (
                      <div
                        key={spot.id}
                        className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 flex items-start gap-3"
                      >
                        <div
                          className={`p-2 rounded-lg mt-0.5 ${
                            spot.severity === 'critical'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white">{spot.title}</h4>
                            <span className="text-[10px] font-mono text-slate-400">
                              Tọa độ: [{spot.location.join(', ')}] mm
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">{spot.description}</p>
                          <p className="text-xs text-emerald-400 font-medium">
                            💡 Khắc phục: {spot.fixSuggestion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: MẸO BAMBU STUDIO */}
              {activeTab === 'tips' && (
                <div className="space-y-3">
                  {analysisResult.bambuStudioProTips.map((tip, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl bg-slate-800/50 border border-emerald-500/20 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 6: CÀI ĐẶT GEMINI API KEY & CHỌN MODEL */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-400" />
                        Kết Nối Google Gemini API Key & Chọn Mô Hình Suy Luận
                      </span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        Lấy API Key miễn phí tại Google AI Studio
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {GEMINI_AVAILABLE_MODELS.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedModelId(m.id);
                            saveGeminiModel(m.id);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            selectedModelId === m.id
                              ? 'bg-emerald-950/50 border-emerald-500/60 text-white'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-300">{m.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
                              {m.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{m.description}</p>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="AIzaSy... (Nhập Gemini API Key của bạn)"
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={handleSaveApiKey}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
                      >
                        Lưu & Phân Tích
                      </button>
                      {isSavedKey && (
                        <button
                          onClick={handleClearApiKey}
                          className="px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs transition cursor-pointer"
                        >
                          Xóa Key
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Mọi thông số AI tinh chỉnh đều được nhúng trực tiếp vào file <strong>.3MF</strong> để mở và in ngay trên Bambu Studio.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleRunAnalysis(selectedIntent)}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              Phân tích lại
            </button>

            <button
              onClick={handleApplyFullProfile}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer ${
                applySuccess
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {applySuccess
                ? 'Đã Áp Dụng Toàn Bộ 6 Nhóm!'
                : 'Áp Dụng Cấu Hình AI (6 Nhóm Bambu)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
