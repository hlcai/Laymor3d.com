import { IGeometryFingerprint } from './GeometryFingerprintEngine';
import { IHistoricalLearningCase } from './SelfImprovingAiAdvisor';

export interface IGoogleCloudStorageConfig {
  appsScriptWebhookUrl?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  driveModelsFolderId?: string;
  masterSpreadsheetId?: string;
}

export interface ISimulationSessionRow {
  sessionId: string;
  timestamp: string;
  modelId: string;
  modelName: string;
  printerId: string;
  material: string;
  layerHeightMm: number;
  infillSpec: string;
  supportSpec: string;
  brimSpec: string;
  speedsMmS: string;
  tempsC: string;
  estFilamentGrams: number;
  estTimeMinutes: number;
  qcHealthScore: number;
  detectedDefects: string;
  userChurnHistory: string;
}

export class GoogleDriveSheetsBridge {
  private config: IGoogleCloudStorageConfig;

  constructor(config?: Partial<IGoogleCloudStorageConfig>) {
    this.config = {
      appsScriptWebhookUrl:
        config?.appsScriptWebhookUrl || process.env.LAYMOR_GDRIVE_WEBHOOK_URL || '',
      clientId: config?.clientId || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: config?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
      refreshToken: config?.refreshToken || process.env.GOOGLE_REFRESH_TOKEN || '',
      driveModelsFolderId:
        config?.driveModelsFolderId || process.env.LAYMOR_GDRIVE_FOLDER_ID || '1_UgbhNBIMWG-S4b48tchzkTqAnGa2f5u',
      masterSpreadsheetId:
        config?.masterSpreadsheetId || process.env.LAYMOR_GSHEET_ID || '1PAee1et38MBG-u1yzIWTxxODflTAE8ZIKO90SzZrKUg',
    };
  }

  getStatus() {
    return {
      configured: Boolean(
        this.config.appsScriptWebhookUrl ||
          (this.config.driveModelsFolderId && this.config.masterSpreadsheetId)
      ),
      driveModelsFolderId: this.config.driveModelsFolderId || null,
      masterSpreadsheetId: this.config.masterSpreadsheetId || null,
      hasWebhook: Boolean(this.config.appsScriptWebhookUrl),
      hasOAuth: Boolean(
        this.config.clientId && this.config.clientSecret && this.config.refreshToken
      ),
    };
  }

  private async getOAuthAccessToken(): Promise<string> {
    if (!this.config.clientId || !this.config.clientSecret || !this.config.refreshToken) {
      throw new Error('Thiếu cấu hình OAuth2 (GOOGLE_CLIENT_ID / SECRET / REFRESH_TOKEN).');
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      throw new Error(`Lỗi cấp Google OAuth2 Token: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.access_token;
  }

  async createDriveResumableUploadUrl(params: {
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    sha256Hash: string;
    originUrl: string;
  }): Promise<{ uploadUrl: string; modelId: string }> {
    const accessToken = await this.getOAuthAccessToken();
    const modelId = `mdl_${params.sha256Hash.substring(0, 10)}`;

    const metadata = {
      name: `${modelId}_${params.fileName}`,
      description: `Laymor3D Uploaded Model | SHA256: ${params.sha256Hash}`,
      parents: this.config.driveModelsFolderId ? [this.config.driveModelsFolderId] : undefined,
      appProperties: {
        modelId,
        sha256: params.sha256Hash,
      },
    };

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': params.mimeType || 'application/octet-stream',
          'X-Upload-Content-Length': String(params.fileSizeBytes),
          Origin: params.originUrl,
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!res.ok) {
      throw new Error(`Không thể tạo Google Drive Resumable Session: HTTP ${res.status}`);
    }

    const uploadUrl = res.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('Google Drive không trả về header Location cho Resumable Upload.');
    }

    return { uploadUrl, modelId };
  }

  static formatModelRegistryRow(
    meta: {
      modelId: string;
      fileName: string;
      fileFormat: string;
      fileSizeMb: number;
      sha256Hash: string;
      gdriveFileId: string;
      gdriveViewUrl: string;
    },
    fp: IGeometryFingerprint
  ): (string | number)[] {
    return [
      meta.modelId,
      new Date().toISOString(),
      meta.fileName,
      meta.fileFormat.toUpperCase(),
      meta.fileSizeMb,
      meta.sha256Hash,
      meta.gdriveFileId,
      meta.gdriveViewUrl,
      `${fp.dimensionsMm.x} x ${fp.dimensionsMm.y} x ${fp.dimensionsMm.z}`,
      fp.trueVolumeCm3,
      fp.bedContactAreaMm2,
      fp.overhangArea45Mm2,
      fp.comHeightRatio,
      JSON.stringify(fp),
    ];
  }

  static formatSimulationSessionRow(row: ISimulationSessionRow): (string | number)[] {
    return [
      row.sessionId,
      row.timestamp,
      row.modelId,
      row.modelName,
      row.printerId,
      row.material,
      row.layerHeightMm,
      row.infillSpec,
      row.supportSpec,
      row.brimSpec,
      row.speedsMmS,
      row.tempsC,
      row.estFilamentGrams,
      row.estTimeMinutes,
      row.qcHealthScore,
      row.detectedDefects,
      row.userChurnHistory,
    ];
  }

  static formatAiLearningRow(
    sessionId: string,
    learningCase: IHistoricalLearningCase
  ): (string | number)[] {
    return [
      learningCase.caseId,
      learningCase.recordedAt,
      learningCase.modelId,
      sessionId,
      learningCase.modelName,
      learningCase.material,
      learningCase.outcome,
      JSON.stringify(learningCase.goldenProfile),
      JSON.stringify(learningCase.fingerprint),
      learningCase.aiInsightLesson,
    ];
  }

  async appendSheetRow(
    sheetTabName: '01_models_registry' | '02_simulation_sessions' | '03_ai_learning_dataset',
    rowValues: (string | number)[]
  ): Promise<{ success: boolean; updatedRange?: string; mode?: string }> {
    if (this.config.appsScriptWebhookUrl) {
      const res = await fetch(this.config.appsScriptWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'append_row',
          sheetName: sheetTabName,
          rowValues,
        }),
      });
      if (!res.ok) throw new Error(`Apps Script Webhook lỗi HTTP ${res.status}`);
      return await res.json();
    }

    if (
      this.config.masterSpreadsheetId &&
      this.config.clientId &&
      this.config.clientSecret &&
      this.config.refreshToken
    ) {
      const accessToken = await this.getOAuthAccessToken();
      const range = encodeURIComponent(`${sheetTabName}!A1`);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.masterSpreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      });

      if (!res.ok) {
        throw new Error(`Lỗi ghi Google Sheets API v4: HTTP ${res.status}`);
      }

      const data = await res.json();
      return {
        success: true,
        updatedRange: data?.updates?.updatedRange,
        mode: 'oauth_sheets_v4',
      };
    }

    return {
      success: false,
      mode: 'pending_credentials',
    };
  }
}

export const googleDriveSheetsBridge = new GoogleDriveSheetsBridge();
