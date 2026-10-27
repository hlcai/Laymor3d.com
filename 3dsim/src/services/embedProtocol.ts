import { ISimulationProfile, IPreflightReport, ViewportDisplayMode } from '@/types/simulator';

export const STUDIO_TO_SIM_STORAGE_KEY = 'laymor_studio_to_3dsim_sync_v1';
export const SIM_TO_STUDIO_STORAGE_KEY = 'laymor_3dsim_to_studio_sync_v1';

export interface IStudioToSimSyncPayload {
  timestamp: number;
  sampleId?: string;
  modelName?: string;
  modelUrl?: string;
  stlBase64?: string;
  dimensionsMm?: { x: number; y: number; z: number };
  scalePercent?: number;
  viewMode?: ViewportDisplayMode;
  profile?: Partial<ISimulationProfile>;
  printerName?: string;
}

export interface ISimToStudioSyncPayload {
  timestamp: number;
  sampleId?: string;
  modelName: string;
  dimensionsMm: { x: number; y: number; z: number };
  filamentWeightGrams: number;
  estimatedPrintTimeMinutes: number;
  totalLayers: number;
  printabilityScore: number;
  overhangPercent: number;
  profile: ISimulationProfile;
  openOrderModal?: boolean;
}

export interface IEmbedMessagePayload {
  action:
    | 'LOAD_MODEL'
    | 'SET_PROFILE'
    | 'PLAY'
    | 'PAUSE'
    | 'SCRUB_PROGRESS'
    | 'REQUEST_REPORT'
    | 'SYNC_FROM_STUDIO';
  modelUrl?: string;
  modelName?: string;
  sampleId?: string;
  stlBuffer?: ArrayBuffer;
  profile?: Partial<ISimulationProfile>;
  progress?: number;
  viewMode?: ViewportDisplayMode;
  scale?: number;
}

/**
 * Ánh xạ ID mẫu giữa /studio (SampleModelId) và /3dsim (SAMPLE_MODELS)
 */
export function mapStudioModelIdToSimSampleId(studioId?: string | null): string | null {
  if (!studioId) return null;
  const clean = studioId.toLowerCase().trim();
  if (clean.includes('benchy')) return 'sample-benchy';
  if (clean.includes('cube')) return 'sample-cube';
  if (clean.includes('gear')) return 'sample-gear';
  if (clean.includes('organizer') || clean.includes('gridfinity') || clean.includes('box') || clean.includes('stand')) {
    return 'sample-organizer';
  }
  if (clean.includes('dragon') || clean.includes('robot') || clean.includes('art')) {
    return 'sample-dragon';
  }
  if (clean.startsWith('sample-')) return clean;
  return `sample-${clean}`;
}

export function mapSimSampleIdToStudioModelId(simId?: string | null): string {
  if (!simId) return 'benchy';
  const clean = simId.replace(/^sample-/, '').toLowerCase();
  if (['benchy', 'dragon', 'cube', 'gear', 'organizer'].includes(clean)) {
    return clean;
  }
  return 'benchy';
}

export class EmbedProtocolService {
  private static instance: EmbedProtocolService;
  private isEmbedded: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.isEmbedded =
        window.self !== window.top || window.location.search.includes('embed=true');
    }
  }

  public static getInstance(): EmbedProtocolService {
    if (!EmbedProtocolService.instance) {
      EmbedProtocolService.instance = new EmbedProtocolService();
    }
    return EmbedProtocolService.instance;
  }

  public getIsEmbedded(): boolean {
    return this.isEmbedded;
  }

  public notifyReady() {
    this.postToParent('SIMULATOR_READY', {
      version: '2.2.0',
      timestamp: Date.now(),
    });
  }

  public notifyTelemetry(telemetry: {
    progress: number;
    currentLayer: number;
    totalLayers: number;
    elapsedTimeSec: number;
    totalTimeSec: number;
    filamentUsedGrams: number;
  }) {
    this.postToParent('SIMULATOR_TELEMETRY', telemetry);
  }

  public notifyReport(report: IPreflightReport) {
    this.postToParent('SIMULATOR_REPORT', report);
  }

  public syncProfile(profile: ISimulationProfile) {
    this.postToParent('SIMULATOR_SYNC_PROFILE', profile);
  }

  /**
   * Đẩy toàn bộ kết quả mô phỏng & cấu hình đã tối ưu từ /3dsim về lại /studio
   */
  public syncBackToStudio(payload: ISimToStudioSyncPayload) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SIM_TO_STUDIO_STORAGE_KEY, JSON.stringify(payload));
      } catch (_) {}
    }
    this.postToParent('SIMULATOR_APPLY_TO_STUDIO', payload);
  }

  /**
   * Đọc dữ liệu khởi tạo được gửi từ /studio qua URL Query hoặc localStorage Bridge
   */
  public consumeInitialStudioBridge(): IStudioToSimSyncPayload | null {
    if (typeof window === 'undefined') return null;

    const params = new URLSearchParams(window.location.search);
    const result: IStudioToSimSyncPayload = { timestamp: Date.now() };
    let hasUrlData = false;

    const modelParam = params.get('model') || params.get('sampleModel');
    if (modelParam) {
      result.sampleId = mapStudioModelIdToSimSampleId(modelParam) || undefined;
      hasUrlData = true;
    }

    const viewModeParam = params.get('viewMode') as ViewportDisplayMode | null;
    if (viewModeParam && ['prepare', 'cad', 'filament_preview'].includes(viewModeParam)) {
      result.viewMode = viewModeParam;
      hasUrlData = true;
    }

    const profilePatch: Partial<ISimulationProfile> = {};
    if (params.get('material')) {
      profilePatch.material = params.get('material') as any;
      hasUrlData = true;
    }
    if (params.get('color')) {
      profilePatch.materialColor = params.get('color')!;
      hasUrlData = true;
    }
    if (params.get('layerHeight')) {
      const lh = parseFloat(params.get('layerHeight')!);
      if (!isNaN(lh) && lh >= 0.08 && lh <= 0.36) profilePatch.layerHeight = lh;
      hasUrlData = true;
    }
    if (params.get('infill')) {
      const inf = parseInt(params.get('infill')!, 10);
      if (!isNaN(inf)) profilePatch.infillDensity = inf;
      hasUrlData = true;
    }
    if (params.get('support')) {
      const sup = params.get('support')!;
      if (['none', 'normal', 'tree'].includes(sup)) {
        profilePatch.supportMode = sup as any;
        hasUrlData = true;
      }
    }
    if (params.get('treeStyle')) {
      const ts = params.get('treeStyle')!;
      if (['organic', 'slim', 'strong', 'hybrid'].includes(ts)) {
        profilePatch.treeStyle = ts as any;
        hasUrlData = true;
      }
    }
    if (params.get('scale')) {
      const sc = parseFloat(params.get('scale')!);
      if (!isNaN(sc) && sc > 10) {
        result.scalePercent = sc;
        hasUrlData = true;
      }
    }

    if (Object.keys(profilePatch).length > 0) {
      result.profile = profilePatch;
    }

    // Kiểm tra thêm trong localStorage (nếu vừa chuyển sang trong vòng 10 phút)
    try {
      const raw = localStorage.getItem(STUDIO_TO_SIM_STORAGE_KEY);
      if (raw) {
        const stored: IStudioToSimSyncPayload = JSON.parse(raw);
        if (stored && Date.now() - stored.timestamp < 10 * 60 * 1000) {
          return {
            ...stored,
            ...result,
            profile: { ...(stored.profile || {}), ...(result.profile || {}) },
          };
        }
      }
    } catch (_) {}

    return hasUrlData ? result : null;
  }

  private postToParent(type: string, data: any) {
    if (typeof window !== 'undefined' && this.isEmbedded) {
      window.parent.postMessage(
        {
          source: '3D_PRINT_SIMULATOR',
          type,
          data,
        },
        '*'
      );
    }
  }
}

export const embedProtocol = EmbedProtocolService.getInstance();
