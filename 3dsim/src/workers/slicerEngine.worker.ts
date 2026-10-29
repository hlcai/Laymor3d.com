import * as THREE from 'three';
import type { ISimulationProfile } from '@/types/simulator';
import { sliceGeometryWith2DSdfCore } from '@/services/sdfSlicerCore';

export interface ISlicerWorkerRequest {
  jobId: number;
  modelName: string;
  profile: ISimulationProfile;
  positions: Float32Array;
  indices: Uint32Array | null;
}

self.onmessage = (event: MessageEvent<ISlicerWorkerRequest>) => {
  const { jobId, modelName, profile, positions, indices } = event.data;

  try {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (indices && indices.length > 0) {
      geom.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
    }

    const output = sliceGeometryWith2DSdfCore(
      geom,
      modelName,
      profile,
      null,
      (percent) => {
        (self as unknown as Worker).postMessage({
          type: 'progress',
          jobId,
          percent,
        });
      }
    );

    geom.dispose();

    (self as unknown as Worker).postMessage({
      type: 'done',
      jobId,
      output,
    });
  } catch (err: any) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      jobId,
      error: err?.message || 'Slicer Worker Error',
    });
  }
};
