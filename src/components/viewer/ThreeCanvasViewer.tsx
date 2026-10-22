import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ViewerOptions } from '@/hooks/useModelViewer';
import { IPrinterProfile, ISupportConfig } from '@/backend/domain/slicing';
import { SAMPLE_PRINT_MODELS, SampleModelId } from '@/backend/domain/sample-models';
import { ModelBuilder } from './ModelBuilder';
import { SupportBuilder } from './SupportBuilder';
import { ILoadedCustomModel } from './CustomModelLoader';
import { UploadCloud, Layers, FileCode, CheckCircle2, RotateCcw, Box, Ruler } from 'lucide-react';

interface ThreeCanvasViewerProps {
  options: ViewerOptions;
  modelUrl?: string;
  className?: string;
  printer?: IPrinterProfile;
  dimensionsMm?: { x: number; y: number; z: number };
  supportConfig?: ISupportConfig;
  currentLayer?: number;
  totalLayers?: number;
  sampleModelId?: SampleModelId;
  customLoadedModel?: ILoadedCustomModel | null;
  onDropFile?: (file: File) => void;
  onClearCustomModel?: () => void;
}

export function ThreeCanvasViewer({
  options,
  className = '',
  printer,
  dimensionsMm = { x: 60, y: 31, z: 48 },
  supportConfig,
  currentLayer = 100,
  totalLayers = 100,
  sampleModelId = 'benchy',
  customLoadedModel,
  onDropFile,
  onClearCustomModel,
}: ThreeCanvasViewerProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Group hierarchy:
  // masterOrbitGroup: Xoay vòng quanh trục Y khi chuột kéo hoặc Tự xoay (Auto-Rotate)
  const masterOrbitGroupRef = useRef<THREE.Group | null>(null);
  // orientationGroup: Xoay góc đặt (0° Phẳng, 45° Nghiêng, 90° Đứng), tự động hạ đáy tiếp xúc bàn Y = -1.5
  const orientationGroupRef = useRef<THREE.Group | null>(null);
  // modelScaleGroup: Tỷ lệ co giãn kích thước (Scale) theo kích thước gốc của mô hình
  const modelScaleGroupRef = useRef<THREE.Group | null>(null);
  // modelMeshGroup: Chứa geometry mô hình 3D
  const modelMeshGroupRef = useRef<THREE.Group | null>(null);
  // supportGroup: Cấu trúc chống đỡ Support (Tree/Normal)
  const supportGroupRef = useRef<THREE.Group | null>(null);
  // dimBoxGroup: Khung bao viền kích thước 3 chiều (Dimension Bounding Box)
  const dimBoxGroupRef = useRef<THREE.Group | null>(null);

  const gridGroupRef = useRef<THREE.Group | null>(null);
  const layerRingRef = useRef<THREE.Mesh | null>(null);
  const clipPlaneRef = useRef<THREE.Plane | null>(null);
  const sharedMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const modelHeightRef = useRef<number>(2.0);

  // DOM Refs for floating dimension badges
  const labelXRef = useRef<HTMLDivElement>(null);
  const labelYRef = useRef<HTMLDivElement>(null);
  const labelZRef = useRef<HTMLDivElement>(null);

  // Đồng bộ refs tức thời để tránh stale closure trong animate loop
  const autoRotateRef = useRef(options.autoRotate);
  useEffect(() => {
    autoRotateRef.current = options.autoRotate;
  }, [options.autoRotate]);

  const showDimensionsRef = useRef(options.showDimensions);
  useEffect(() => {
    showDimensionsRef.current = options.showDimensions;
  }, [options.showDimensions]);

  // Mouse interaction state for orbit rotation & zoom
  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });

  // 1. Core Scene Initialization
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // A. Scene with rich modern dark slate background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    // B. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3.2, 7.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // C. Renderer with local clipping enabled for slicing simulation
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.localClippingEnabled = true;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // D. 3-Point Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 0.9);
    fillLight.position.set(-6, 2, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(0, -6, 6);
    scene.add(rimLight);

    // E. Grid & Bed Group
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);
    gridGroupRef.current = gridGroup;

    // F. Dimension Wireframe Box Group
    const dimBoxGroup = new THREE.Group();
    scene.add(dimBoxGroup);
    dimBoxGroupRef.current = dimBoxGroup;

    // G. Slicing Clipping Plane: cuts off anything above current layer
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000);
    clipPlaneRef.current = clipPlane;

    // H. Active Layer Glowing Indicator Ring
    const ringGeo = new THREE.RingGeometry(0.1, 1.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const layerRing = new THREE.Mesh(ringGeo, ringMat);
    layerRing.rotation.x = -Math.PI / 2;
    layerRing.visible = false;
    scene.add(layerRing);
    layerRingRef.current = layerRing;

    // I. Shared Material for Printable Model
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(options.materialColor || '#6366f1'),
      wireframe: options.wireframe,
      roughness: options.roughness || 0.35,
      metalness: options.metalness || 0.15,
      clippingPlanes: [clipPlane],
      clipShadows: true,
      side: THREE.DoubleSide,
    });
    sharedMaterialRef.current = material;

    // J. GROUP HIERARCHY FOR ROBUST TRANSFORMS:
    // 1. masterOrbitGroup: Xoay vòng quanh bàn in
    const masterOrbit = new THREE.Group();
    scene.add(masterOrbit);
    masterOrbitGroupRef.current = masterOrbit;

    // 2. orientationGroup: Xoay góc đặt in (0°, 45°, 90°)
    const orientationGroup = new THREE.Group();
    orientationGroup.position.set(0, -1.5, 0);
    masterOrbit.add(orientationGroup);
    orientationGroupRef.current = orientationGroup;

    // 3. modelScaleGroup: Co giãn tỷ lệ mô hình
    const modelScaleGroup = new THREE.Group();
    orientationGroup.add(modelScaleGroup);
    modelScaleGroupRef.current = modelScaleGroup;

    // 4. modelMeshGroup: Chứa Mesh
    const meshGroup = new THREE.Group();
    modelScaleGroup.add(meshGroup);
    modelMeshGroupRef.current = meshGroup;

    // 5. supportGroup: Chứa Support
    const supportGroup = new THREE.Group();
    modelScaleGroup.add(supportGroup);
    supportGroupRef.current = supportGroup;

    // K. Build Initial Model
    const { group: initialMeshGroup, height: builtHeight } = ModelBuilder.buildModel(sampleModelId, material);
    modelHeightRef.current = builtHeight;
    meshGroup.add(initialMeshGroup);

    // L. Build Initial Supports if enabled
    if (supportConfig?.enabled && supportConfig.type !== 'none') {
      const initialSupports = SupportBuilder.buildSupports(
        supportConfig.type,
        sampleModelId,
        clipPlane
      );
      supportGroup.add(initialSupports);
    }

    // M. Mouse Orbit Handlers
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !masterOrbitGroupRef.current) return;
      const deltaX = e.clientX - prevMousePos.current.x;
      const deltaY = e.clientY - prevMousePos.current.y;

      masterOrbitGroupRef.current.rotation.y += deltaX * 0.01;
      camera.position.y = Math.max(-1, Math.min(10, camera.position.y + deltaY * 0.01));
      camera.lookAt(0, 0, 0);
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z = Math.max(3, Math.min(16, cameraRef.current.position.z + e.deltaY * 0.005));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // N. Animation Loop: Auto-rotate & 3D dimension projection
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (masterOrbitGroupRef.current && autoRotateRef.current && !isDraggingRef.current) {
        masterOrbitGroupRef.current.rotation.y += 0.005;
      }

      // Cập nhật vị trí hiển thị thước đo 3D (3D Dimension projection labels)
      if (
        showDimensionsRef.current &&
        orientationGroupRef.current &&
        cameraRef.current &&
        containerRef.current
      ) {
        const box = new THREE.Box3().setFromObject(orientationGroupRef.current);
        if (!box.isEmpty()) {
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;

          // 1. Trục X: Chiều rộng (Tọa độ giữa cạnh đáy phía trước)
          const pX = new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y, box.max.z + 0.05).project(cameraRef.current);
          if (labelXRef.current && pX.z < 1) {
            const sx = (pX.x * 0.5 + 0.5) * w;
            const sy = (-pX.y * 0.5 + 0.5) * h;
            labelXRef.current.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
            labelXRef.current.style.display = 'block';
          }

          // 2. Trục Z (Three.js Z / Slicer Y): Chiều sâu (Tọa độ giữa cạnh đáy bên phải)
          const pZ = new THREE.Vector3(box.max.x + 0.05, box.min.y, (box.min.z + box.max.z) / 2).project(cameraRef.current);
          if (labelZRef.current && pZ.z < 1) {
            const sx = (pZ.x * 0.5 + 0.5) * w;
            const sy = (-pZ.y * 0.5 + 0.5) * h;
            labelZRef.current.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
            labelZRef.current.style.display = 'block';
          }

          // 3. Trục Y (Three.js Y / Slicer Z): Chiều cao thẳng đứng (Tọa độ giữa cạnh đứng bên trái)
          const pY = new THREE.Vector3(box.min.x - 0.05, (box.min.y + box.max.y) / 2, box.max.z).project(cameraRef.current);
          if (labelYRef.current && pY.z < 1) {
            const sx = (pY.x * 0.5 + 0.5) * w;
            const sy = (-pY.y * 0.5 + 0.5) * h;
            labelYRef.current.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
            labelYRef.current.style.display = 'block';
          }
        }
      } else {
        if (labelXRef.current) labelXRef.current.style.display = 'none';
        if (labelYRef.current) labelYRef.current.style.display = 'none';
        if (labelZRef.current) labelZRef.current.style.display = 'none';
      }

      renderer.render(scene, camera);
    };
    animate();

    // O. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Hàm tính toán góc đặt & tự động áp sát mặt đáy xuống bàn in Y = -1.5
  const updateOrientationAndGrounding = useCallback(() => {
    if (!orientationGroupRef.current) return;
    const group = orientationGroupRef.current;

    // 1. Áp dụng góc xoay định hướng quanh trục X (0°, 45°, 90°)
    const rad = ((options.orientationDeg || 0) * Math.PI) / 180;
    group.rotation.x = rad;

    // 2. Đo đạc Bounding Box thực tế sau khi xoay để căn phẳng tiếp xúc mặt bàn
    group.position.y = 0;
    group.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(group);
    const bedSurfaceY = -1.5;

    // Đẩy cụm mô hình sao cho điểm thấp nhất (min.y) luôn tiếp xúc hoàn hảo với mặt bàn Y = -1.5
    group.position.y = bedSurfaceY - box.min.y;

    // Cập nhật chiều cao thực tế của mô hình sau khi xoay để mô phỏng cắt lớp chính xác
    const calculatedHeight = Math.max(0.1, box.max.y - box.min.y);
    modelHeightRef.current = calculatedHeight;

    // 3. Cập nhật khung viền đo đạc kích thước 3D (Dimension wireframe)
    if (dimBoxGroupRef.current) {
      dimBoxGroupRef.current.clear();
      if (options.showDimensions) {
        group.updateMatrixWorld(true);
        const currentBox = new THREE.Box3().setFromObject(group);
        const boxSize = new THREE.Vector3();
        currentBox.getSize(boxSize);
        const boxCenter = new THREE.Vector3();
        currentBox.getCenter(boxCenter);

        const boxGeo = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z);
        const edges = new THREE.EdgesGeometry(boxGeo);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x818cf8,
          transparent: true,
          opacity: 0.35,
        });
        const boxLines = new THREE.LineSegments(edges, lineMat);
        boxLines.position.copy(boxCenter);
        dimBoxGroupRef.current.add(boxLines);
      }
    }
  }, [options.orientationDeg, options.showDimensions]);

  // 2. Update Model Mesh when sampleModelId or customLoadedModel changes
  useEffect(() => {
    if (!modelMeshGroupRef.current || !sharedMaterialRef.current) return;
    const meshGroup = modelMeshGroupRef.current;
    meshGroup.clear();

    if (sampleModelId === 'custom' && customLoadedModel) {
      customLoadedModel.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = sharedMaterialRef.current!;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      meshGroup.add(customLoadedModel.group);
    } else {
      const { group: newMesh } = ModelBuilder.buildModel(sampleModelId, sharedMaterialRef.current);
      newMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      meshGroup.add(newMesh);
    }

    updateOrientationAndGrounding();
  }, [sampleModelId, customLoadedModel, updateOrientationAndGrounding]);

  // 3. Update Bed Plate & Build Volume Box when printer changes
  useEffect(() => {
    if (!gridGroupRef.current) return;
    const group = gridGroupRef.current;
    group.clear();

    const bedDimX = printer?.bedDimensions.x || 256;
    const bedDimY = printer?.bedDimensions.y || 256;
    const bedDimZ = printer?.bedDimensions.z || 256;

    const bedX = bedDimX / 50;
    const bedY = bedDimY / 50;
    const bedZ = bedDimZ / 50;

    // A. Textured Dark Build Plate (Gold PEI / Textured Sheet)
    const plateGeo = new THREE.PlaneGeometry(bedX, bedY);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.3,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.rotation.x = -Math.PI / 2;
    plate.position.y = -1.5;
    plate.receiveShadow = true;
    group.add(plate);

    // B. Bed Plate Accent Border
    const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(bedX, 0.05, bedY));
    const borderMat = new THREE.LineBasicMaterial({
      color: printer ? new THREE.Color(printer.accentColor) : 0x10b981,
    });
    const borderLine = new THREE.LineSegments(borderGeo, borderMat);
    borderLine.position.y = -1.5;
    group.add(borderLine);

    // C. Bed Grid lines (10mm squares)
    const grid = new THREE.GridHelper(Math.max(bedX, bedY), 16, 0x6366f1, 0x475569);
    grid.position.y = -1.49;
    group.add(grid);

    // D. Build Volume Bounding Box Outline
    const boxGeo = new THREE.BoxGeometry(bedX, bedZ, bedY);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: printer ? new THREE.Color(printer.accentColor) : 0x4f46e5,
      transparent: true,
      opacity: 0.3,
    });
    const boxLines = new THREE.LineSegments(edges, lineMat);
    boxLines.position.y = -1.5 + bedZ / 2;
    group.add(boxLines);
  }, [printer]);

  // 4. Update Model Dimensions & Scale
  useEffect(() => {
    if (!modelScaleGroupRef.current) return;

    let baseDim = { x: 60, y: 31, z: 48 };
    if (sampleModelId === 'custom' && customLoadedModel) {
      baseDim = customLoadedModel.originalDimensionsMm;
    } else {
      const sample = SAMPLE_PRINT_MODELS.find(m => m.id === sampleModelId);
      if (sample) baseDim = sample.defaultDimensionsMm;
    }

    const scaleX = baseDim.x > 0 ? Math.max(0.05, dimensionsMm.x / baseDim.x) : 1.0;
    const scaleY = baseDim.z > 0 ? Math.max(0.05, dimensionsMm.z / baseDim.z) : 1.0; // Slicer Z là Three.js Y (chiều cao)
    const scaleZ = baseDim.y > 0 ? Math.max(0.05, dimensionsMm.y / baseDim.y) : 1.0; // Slicer Y là Three.js Z (chiều sâu)

    modelScaleGroupRef.current.scale.set(scaleX, scaleY, scaleZ);

    updateOrientationAndGrounding();
  }, [dimensionsMm, sampleModelId, customLoadedModel, updateOrientationAndGrounding]);

  // 5. Update Virtual Support Structures (Organic Tree Support)
  useEffect(() => {
    if (!supportGroupRef.current) return;
    const sGroup = supportGroupRef.current;
    sGroup.clear();

    if (!supportConfig?.enabled || supportConfig.type === 'none') return;

    const supports = SupportBuilder.buildSupports(
      supportConfig.type,
      sampleModelId,
      clipPlaneRef.current || undefined,
      sampleModelId === 'custom' ? customLoadedModel?.group : undefined
    );
    sGroup.add(supports);
  }, [supportConfig, sampleModelId, customLoadedModel]);

  // 6. Cập nhật góc đặt và căn phẳng bàn in khi options.orientationDeg hoặc options.showDimensions thay đổi
  useEffect(() => {
    updateOrientationAndGrounding();
  }, [options.orientationDeg, options.showDimensions, updateOrientationAndGrounding]);

  // 7. Slicing Simulation: Mặt phẳng cắt lát (Clipping Plane) theo tiến trình layer in
  useEffect(() => {
    if (!clipPlaneRef.current) return;

    const progress = Math.max(0.01, Math.min(1, currentLayer / (totalLayers || 1)));

    if (progress >= 0.999) {
      clipPlaneRef.current.constant = 1000;
      if (layerRingRef.current) layerRingRef.current.visible = false;
    } else {
      const baseY = -1.5;
      const modelTopY = baseY + modelHeightRef.current;
      const cutY = baseY + (modelTopY - baseY) * progress;

      clipPlaneRef.current.constant = cutY;

      if (layerRingRef.current) {
        layerRingRef.current.position.y = cutY;
        layerRingRef.current.visible = true;
      }
    }
  }, [currentLayer, totalLayers, dimensionsMm, options.orientationDeg]);

  // 8. Update Material Properties (Color, Wireframe, Toolpath Mode)
  useEffect(() => {
    if (sharedMaterialRef.current) {
      const mat = sharedMaterialRef.current;
      mat.wireframe = options.wireframe;
      const activeColor = options.viewMode === 'toolpath' ? '#f97316' : options.materialColor;
      mat.color.set(activeColor);
      mat.roughness = options.viewMode === 'toolpath' ? 0.25 : (options.roughness || 0.35);
      mat.metalness = options.viewMode === 'toolpath' ? 0.05 : (options.metalness || 0.15);
      mat.needsUpdate = true;
    }
    if (gridGroupRef.current) {
      gridGroupRef.current.visible = options.showGrid;
    }
  }, [options.wireframe, options.viewMode, options.materialColor, options.roughness, options.metalness, options.showGrid]);

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && onDropFile) {
          onDropFile(file);
        }
      }}
      className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 ${className}`}
      style={{ minHeight: '500px', height: '500px' }}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".stl,.obj,.glb,.gltf,.3mf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onDropFile) {
            onDropFile(file);
          }
          e.target.value = '';
        }}
      />

      {/* WebGL Canvas Element */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ width: '100%', height: '100%' }}
      />

      {/* 3D Floating Dimension Badges (anchored to model bounding box in real time) */}
      {options.showDimensions && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {/* Dimension X: Width */}
          <div
            ref={labelXRef}
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 hidden px-2 py-0.5 rounded-md bg-slate-900/90 border border-indigo-500/60 shadow-lg text-[10px] font-mono font-bold text-indigo-300 whitespace-nowrap backdrop-blur-sm"
          >
            ↔ X: {dimensionsMm.x} mm
          </div>

          {/* Dimension Z: Depth along build bed */}
          <div
            ref={labelZRef}
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 hidden px-2 py-0.5 rounded-md bg-slate-900/90 border border-emerald-500/60 shadow-lg text-[10px] font-mono font-bold text-emerald-300 whitespace-nowrap backdrop-blur-sm"
          >
            ⤢ Y: {dimensionsMm.y} mm
          </div>

          {/* Dimension Y: Vertical Height */}
          <div
            ref={labelYRef}
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 hidden px-2 py-0.5 rounded-md bg-slate-900/90 border border-amber-500/60 shadow-lg text-[10px] font-mono font-bold text-amber-300 whitespace-nowrap backdrop-blur-sm"
          >
            ↕ Z: {dimensionsMm.z} mm
          </div>
        </div>
      )}

      {/* Printer Bed & Volume Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1.5 z-10">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex items-center gap-2 text-xs font-semibold text-slate-200">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: printer?.accentColor || '#6366f1' }}
          />
          <span>Bàn in: {printer ? printer.name : 'Bambu Lab X1-Carbon'}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            ({printer?.bedDimensions.x}×{printer?.bedDimensions.y}×{printer?.bedDimensions.z} mm)
          </span>
        </div>

        {supportConfig?.enabled && supportConfig.type !== 'none' && (
          <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 font-medium flex items-center gap-1.5 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Support: {supportConfig.type === 'tree' ? 'Tree Support (Dạng cây xanh ngọc)' : 'Normal Support (Cột lưới)'}</span>
          </div>
        )}
      </div>

      {/* Top Right: Custom Model Status & Upload Action Button */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        {currentLayer < totalLayers && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Lớp {currentLayer} / {totalLayers}</span>
          </div>
        )}

        {customLoadedModel ? (
          <div className="flex items-center gap-2 bg-slate-900/90 border border-indigo-500/40 px-3 py-1.5 rounded-xl backdrop-blur-md text-xs shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-white max-w-[130px] truncate" title={customLoadedModel.fileName}>
              {customLoadedModel.fileName}
            </span>
            <span className="text-[10px] text-indigo-300 font-mono">
              ({(customLoadedModel.triangleCount / 1000).toFixed(1)}k mặt)
            </span>
            {onClearCustomModel && (
              <button
                type="button"
                onClick={onClearCustomModel}
                className="p-1 text-slate-400 hover:text-pink-400 transition-colors"
                title="Khôi phục mô hình mẫu"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white text-xs font-semibold backdrop-blur-md shadow-lg transition-all active:scale-95"
            title="Tải file 3D từ máy tính của bạn (.STL, .OBJ, .GLB, .3MF)"
          >
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            <span>Nạp File 3D</span>
          </button>
        )}
      </div>

      {/* Slicer Toolpath Line Type Legend Overlay */}
      {options.viewMode === 'toolpath' && (
        <div className="absolute bottom-4 left-4 pointer-events-none p-3 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 text-[11px] font-medium space-y-1.5 shadow-2xl z-10 animate-in fade-in duration-200">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>Màu Đường In Slicer (Line Type):</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#f97316]" />
              <span>Thành ngoài (Outer)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#eab308]" />
              <span>Thành trong (Inner)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
              <span>Cây Support (Tree)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#6ee7b7]" />
              <span>Đệm tiếp xúc (Pad)</span>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 bg-indigo-950/85 backdrop-blur-md border-2 border-dashed border-indigo-400 flex flex-col items-center justify-center p-6 text-center space-y-3 pointer-events-none animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 animate-bounce">
            <UploadCloud className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Thả File 3D Vào Đây Để Xem Ngay!</h3>
            <p className="text-xs text-indigo-200 mt-1">
              Hỗ trợ tự động đọc và tính toán: <strong>.STL, .OBJ, .GLB, .3MF</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
