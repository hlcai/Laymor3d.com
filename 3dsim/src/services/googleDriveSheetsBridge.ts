import { IGeometryFingerprint } from './geometryFingerprintEngine';

export async function syncModelFingerprintToCloud(params: {
  modelId: string;
  fileName: string;
  fileFormat: string;
  fileSizeMb: number;
  sha256Hash?: string;
  fingerprint: IGeometryFingerprint;
}): Promise<any> {
  try {
    const res = await fetch('/api/v1/storage/gdrive-init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function logSimulationSessionToCloud(sessionData: Record<string, any>): Promise<any> {
  try {
    const res = await fetch('/api/v1/storage/log-simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
