import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const BaseSvg: React.FC<IconProps> = ({ size = 14, className = '', children, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {children}
  </svg>
);

/* ============================================================================
 * 1. CORE STUDIO & 3D CAD GEOMETRIC ICONS (Icon* Naming)
 * ============================================================================ */

/** Isometric Technical Cube */
export const IconCube: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 1.75L13.75 5V11L8 14.25L2.25 11V5L8 1.75Z" />
    <path d="M8 8V14.25" />
    <path d="M8 8L13.75 5" />
    <path d="M8 8L2.25 5" />
  </BaseSvg>
);

/** Orthographic Axis / Build Plate Prepare */
export const IconAxis: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 2V8M8 8L13.2 11M8 8L2.8 11" />
    <circle cx="8" cy="8" r="1.25" />
    <path d="M6.5 3.5L8 2L9.5 3.5" />
  </BaseSvg>
);

/** Precision Layer Stack / Slicer */
export const IconLayers: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2 5.5L8 2.5L14 5.5L8 8.5L2 5.5Z" />
    <path d="M2 8.75L8 11.75L14 8.75" />
    <path d="M2 11.75L8 14.75L14 11.75" />
  </BaseSvg>
);

/** Continuous G-Code Toolpath / Extrusion Line */
export const IconToolpath: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.5 4H11.5C12.6 4 13.5 4.9 13.5 6C13.5 7.1 12.6 8 11.5 8H4.5C3.4 8 2.5 8.9 2.5 10C2.5 11.1 3.4 12 4.5 12H13.5" />
    <circle cx="13.5" cy="12" r="1" fill="currentColor" />
  </BaseSvg>
);

/** Extruder Nozzle Schematic */
export const IconNozzle: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M4.5 2H11.5V6.5L9.25 10.5H6.75L4.5 6.5V2Z" />
    <path d="M8 10.5V14" />
    <path d="M3 4.25H13" />
  </BaseSvg>
);

/** Tree Support / Structural Truss */
export const IconSupport: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.5 3.5H13.5" />
    <path d="M8 13.5V7.5" />
    <path d="M8 9L4.5 3.5" />
    <path d="M8 9L11.5 3.5" />
    <path d="M5 13.5H11" />
  </BaseSvg>
);

/** Overhang Angle Inspection */
export const IconAngle: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.5 13.5H13.5" />
    <path d="M2.5 13.5L11.5 3.5" />
    <path d="M8.5 13.5C8.5 11.2 7.4 9.5 5.8 8.5" />
  </BaseSvg>
);

/** Minimalist File Import / Upload */
export const IconImport: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 10.5V2.5" />
    <path d="M5 5.25L8 2.25L11 5.25" />
    <path d="M2.5 10.5V12.5C2.5 13.05 2.95 13.5 3.5 13.5H12.5C13.05 13.5 13.5 13.05 13.5 12.5V10.5" />
  </BaseSvg>
);

/** Minimalist Export / G-code Download */
export const IconExport: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 2.5V10.5" />
    <path d="M5 7.75L8 10.75L11 7.75" />
    <path d="M2.5 11V12.5C2.5 13.05 2.95 13.5 3.5 13.5H12.5C13.05 13.5 13.5 13.05 13.5 12.5V11" />
  </BaseSvg>
);

/** Archive / Model Library Grid */
export const IconArchive: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2.25" y="2.25" width="4.75" height="4.75" rx="0.75" />
    <rect x="9" y="2.25" width="4.75" height="4.75" rx="0.75" />
    <rect x="2.25" y="9" width="4.75" height="4.75" rx="0.75" />
    <rect x="9" y="9" width="4.75" height="4.75" rx="0.75" />
  </BaseSvg>
);

/** Neural / Generative Hexagonal CAD Mesh Node (Replaces Vibe-code 4-point Sparkles) */
export const IconMeshGen: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <polygon points="8,1.8 13.4,4.9 13.4,11.1 8,14.2 2.6,11.1 2.6,4.9" />
    <circle cx="8" cy="8" r="1.6" />
    <path d="M8 1.8V6.4M13.4 4.9L9.4 7.2M13.4 11.1L9.4 8.8M8 14.2V9.6M2.6 11.1L6.6 8.8M2.6 4.9L6.6 7.2" />
  </BaseSvg>
);

/** Terminal / CLI Engine */
export const IconTerminal: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
    <path d="M4.75 6.25L7.25 8L4.75 9.75" />
    <path d="M8.5 9.75H11.25" />
  </BaseSvg>
);

/** Inspection Check / Quality Metric */
export const IconCheckShield: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 2L13 3.8V7.8C13 10.9 10.8 13.1 8 14C5.2 13.1 3 10.9 3 7.8V3.8L8 2Z" />
    <path d="M5.75 8L7.25 9.5L10.5 6.25" />
  </BaseSvg>
);

/** Precision Sliders / Process Parameters */
export const IconSliders: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.5 4.5H13.5" />
    <path d="M2.5 8H13.5" />
    <path d="M2.5 11.5H13.5" />
    <rect x="4.3" y="3.3" width="2.4" height="2.4" rx="0.5" fill="var(--bg-panel, #111)" />
    <rect x="9.3" y="6.8" width="2.4" height="2.4" rx="0.5" fill="var(--bg-panel, #111)" />
    <rect x="5.3" y="10.3" width="2.4" height="2.4" rx="0.5" fill="var(--bg-panel, #111)" />
  </BaseSvg>
);

/** Velocity / Speed Gauge */
export const IconVelocity: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M3 12C2.3 10.9 2 9.6 2 8.2C2 4.8 4.7 2 8 2C11.3 2 14 4.8 14 8.2C14 9.6 13.7 10.9 13 12" />
    <path d="M8 8.5L11.2 5.3" />
    <circle cx="8" cy="8.5" r="1.2" />
  </BaseSvg>
);

/** Thermal / Temperature Schematic */
export const IconThermal: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M6.5 3.5V9.2C5.6 9.7 5 10.6 5 11.7C5 13.3 6.3 14.5 8 14.5C9.7 14.5 11 13.3 11 11.7C11 10.6 10.4 9.7 9.5 9.2V3.5C9.5 2.7 8.8 2 8 2C7.2 2 6.5 2.7 6.5 3.5Z" />
    <circle cx="8" cy="11.7" r="1.2" fill="currentColor" />
  </BaseSvg>
);

/** Extrusion Flow / Rheology */
export const IconFlow: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 2.25C8 2.25 3.5 7.2 3.5 10.2C3.5 12.6 5.5 14.25 8 14.25C10.5 14.25 12.5 12.6 12.5 10.2C12.5 7.2 8 2.25 8 2.25Z" />
  </BaseSvg>
);

/** API Key / Token Access */
export const IconKeyMinimal: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="5.5" cy="8" r="2.75" />
    <path d="M8.25 8H14" />
    <path d="M11.5 8V10.25" />
    <path d="M13.5 8V9.75" />
  </BaseSvg>
);

/** Camera Aperture / Timelapse */
export const IconAperture: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2" y="3.5" width="12" height="9.5" rx="1.5" />
    <circle cx="8" cy="8.25" r="2.5" />
    <path d="M5.5 3.5L6.3 2.25H9.7L10.5 3.5" />
  </BaseSvg>
);

/** Sun / Light Mode */
export const IconSun: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.75V3M8 13V14.25M1.75 8H3M13 8H14.25M3.58 3.58L4.46 4.46M11.54 11.54L12.42 12.42M12.42 3.58L11.54 4.46M4.46 11.54L3.58 12.42" />
  </BaseSvg>
);

/** Moon / Dark Mode */
export const IconMoon: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M13.2 10.2C12.4 10.5 11.5 10.7 10.5 10.7C6.8 10.7 3.8 7.7 3.8 4C3.8 3.2 4 2.4 4.3 1.8C2.4 2.8 1.2 4.8 1.2 7.2C1.2 10.8 4.1 13.7 7.7 13.7C10.3 13.7 12.5 12.2 13.2 10.2Z" />
  </BaseSvg>
);

/** Chevron / Directional Arrows */
export const IconChevronDown: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M4.25 6.25L8 10L11.75 6.25" />
  </BaseSvg>
);

export const IconChevronUp: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M4.25 9.75L8 6L11.75 9.75" />
  </BaseSvg>
);

export const IconChevronLeft: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M9.75 4.25L6 8L9.75 11.75" />
  </BaseSvg>
);

export const IconChevronRight: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M6.25 4.25L10 8L6.25 11.75" />
  </BaseSvg>
);

/** Play / Pause / Reset Minimalist Transport */
export const IconPlay: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <polygon points="4.5,3 12.5,8 4.5,13" />
  </BaseSvg>
);

export const IconPause: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="4.25" y="3" width="2.5" height="10" rx="0.5" />
    <rect x="9.25" y="3" width="2.5" height="10" rx="0.5" />
  </BaseSvg>
);

export const IconReset: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M3 8C3 5.24 5.24 3 8 3C10.76 3 13 5.24 13 8C13 10.76 10.76 13 8 13C6.1 13 4.45 11.95 3.6 10.4" />
    <path d="M2.75 5.5V3H5.25" />
  </BaseSvg>
);

export const IconClose: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M4 4L12 12M12 4L4 12" />
  </BaseSvg>
);

/* ============================================================================
 * 2. COMPLETE CUSTOM MINIMALIST TECHNICAL ICON SUITE (Replaces all Lucide icons)
 *    Every icon is a bespoke 16x16 precision CAD / architectural line vector
 * ============================================================================ */

/** Sparkles -> Hexagonal Isometric CAD Precision Node (Zero 4-point star vibe-code look) */
export const Sparkles = IconMeshGen;

/** Zap -> Technical Pulse Step-Wave / Power Busbar Schematic */
export const Zap: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2" y="2" width="12" height="12" rx="1.5" />
    <path d="M4.5 9.5L7 5.5L9 10.5L11.5 6.5" />
  </BaseSvg>
);

/** Rocket -> Precision Vertical Z-Gantry Vector Arrow */
export const Rocket: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 2L11.5 5.5M8 2L4.5 5.5M8 2V11.5" />
    <path d="M3 13.75H13" />
    <rect x="6" y="11.5" width="4" height="2.25" rx="0.4" />
  </BaseSvg>
);

/** Bot / Brain -> Precision Neural Matrix IC Schematic */
export const Bot: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="3.5" y="3.5" width="9" height="9" rx="1.2" />
    <circle cx="6.5" cy="7.5" r="0.8" fill="currentColor" />
    <circle cx="9.5" cy="7.5" r="0.8" fill="currentColor" />
    <path d="M6 10H10M8 1.5V3.5M1.5 8H3.5M12.5 8H14.5M8 12.5V14.5" />
  </BaseSvg>
);

export const Brain: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <polygon points="8,2 13,5 13,11 8,14 3,11 3,5" />
    <path d="M8 2V14M3 5L13 11M13 5L3 11" />
    <circle cx="8" cy="8" r="2" fill="var(--bg-panel, #111)" />
  </BaseSvg>
);

/** Crown / Award -> Precision Isometric Diamond Certification Badge */
export const Crown: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <polygon points="8,1.8 14,8 8,14.2 2,8" />
    <polygon points="8,4.6 11.4,8 8,11.4 4.6,8" />
  </BaseSvg>
);

export const Award: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <polygon points="8,2 12.5,4.6 12.5,9.8 8,12.4 3.5,9.8 3.5,4.6" />
    <path d="M6 11.5L5 14.5L8 13.2L11 14.5L10 11.5" />
    <circle cx="8" cy="7.2" r="1.5" />
  </BaseSvg>
);

/** Wand2 / Lightbulb -> Precision Optical Reticle & Calibration Target */
export const Wand2: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="8" cy="8" r="4.5" />
    <circle cx="8" cy="8" r="1.2" />
    <path d="M8 1.5V3.5M8 12.5V14.5M1.5 8H3.5M12.5 8H14.5" />
  </BaseSvg>
);

export const Lightbulb: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M5.5 10.5L4.2 7.5L8 2.2L11.8 7.5L10.5 10.5H5.5Z" />
    <path d="M6 12.5H10M6.8 14.2H9.2" />
  </BaseSvg>
);

export const Box = IconCube;
export const Layers = IconLayers;
export const Terminal = IconTerminal;
export const Sliders = IconSliders;
export const SlidersHorizontal = IconSliders;
export const Settings = IconSliders;
export const Settings2 = IconSliders;
export const Key = IconKeyMinimal;
export const KeyRound = IconKeyMinimal;
export const Camera = IconAperture;
export const Video: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2" y="4" width="8.5" height="8" rx="1.2" />
    <polygon points="10.5,6.5 14,4.5 14,11.5 10.5,9.5" />
  </BaseSvg>
);
export const Thermometer = IconThermal;
export const Gauge = IconVelocity;
export const ShieldCheck = IconCheckShield;
export const Upload = IconImport;
export const UploadCloud = IconImport;
export const Download = IconExport;
export const Play = IconPlay;
export const Pause = IconPause;
export const RotateCcw = IconReset;
export const RotateCw: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M13 8C13 5.24 10.76 3 8 3C5.24 3 3 5.24 3 8C3 10.76 5.24 13 8 13C9.9 13 11.55 11.95 12.4 10.4" />
    <path d="M13.25 5.5V3H10.75" />
  </BaseSvg>
);
export const RefreshCw = RotateCw;
export const Repeat: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M11.5 2.5L13.5 4.5L11.5 6.5" />
    <path d="M2.5 7.5V6C2.5 4.9 3.4 4.5 4.5 4.5H13.5" />
    <path d="M4.5 13.5L2.5 11.5L4.5 9.5" />
    <path d="M13.5 8.5V10C13.5 11.1 12.6 11.5 11.5 11.5H2.5" />
  </BaseSvg>
);
export const X = IconClose;
export const ChevronDown = IconChevronDown;
export const ChevronUp = IconChevronUp;
export const ChevronLeft = IconChevronLeft;
export const ChevronRight = IconChevronRight;

export const ArrowRight: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.5 8H13.5M9.5 4L13.5 8L9.5 12" />
  </BaseSvg>
);

export const ArrowLeft: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M13.5 8H2.5M6.5 4L2.5 8L6.5 12" />
  </BaseSvg>
);

export const ArrowUp: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 13.5V2.5M4 6.5L8 2.5L12 6.5" />
  </BaseSvg>
);

export const ArrowDown: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 2.5V13.5M4 9.5L8 13.5L12 9.5" />
  </BaseSvg>
);

export const ArrowUpRight: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M4 12L12 4M6 4H12V10" />
  </BaseSvg>
);

export const ArrowDownLeft: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M12 4L4 12M10 12H4V6" />
  </BaseSvg>
);

export const ExternalLink: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M9.5 2.5H13.5V6.5M13.5 2.5L7.5 8.5" />
    <path d="M11.5 9.5V12.5C11.5 13.05 11.05 13.5 10.5 13.5H3.5C2.95 13.5 2.5 13.05 2.5 12.5V5.5C2.5 4.95 2.95 4.5 3.5 4.5H6.5" />
  </BaseSvg>
);

export const Check: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M3 8.2L6.4 11.6L13.2 4.6" />
  </BaseSvg>
);

export const CheckCircle: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2.5" />
    <path d="M5.25 8.1L7.1 10L10.8 6" />
  </BaseSvg>
);

export const CheckCircle2 = CheckCircle;
export const CheckSquare = CheckCircle;

export const AlertTriangle: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <polygon points="8,2.2 14.2,13.5 1.8,13.5" />
    <path d="M8 6.5V9.5" />
    <circle cx="8" cy="11.5" r="0.6" fill="currentColor" />
  </BaseSvg>
);

export const AlertCircle: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <polygon points="5.2,2 10.8,2 14,5.2 14,10.8 10.8,14 5.2,14 2,10.8 2,5.2" />
    <path d="M8 5.2V8.8" />
    <circle cx="8" cy="11" r="0.6" fill="currentColor" />
  </BaseSvg>
);

export const Info: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2.5" />
    <path d="M8 7.2V11.2" />
    <circle cx="8" cy="5" r="0.6" fill="currentColor" />
  </BaseSvg>
);

export const HelpCircle: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2.5" />
    <path d="M6.4 6.2C6.4 5.3 7.1 4.6 8 4.6C8.9 4.6 9.6 5.3 9.6 6.2C9.6 7 8.8 7.5 8 8V9" />
    <circle cx="8" cy="11.2" r="0.6" fill="currentColor" />
  </BaseSvg>
);

export const Shield: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 2L13 3.8V7.8C13 10.9 10.8 13.1 8 14C5.2 13.1 3 10.9 3 7.8V3.8L8 2Z" />
  </BaseSvg>
);

export const ShieldAlert: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 2L13 3.8V7.8C13 10.9 10.8 13.1 8 14C5.2 13.1 3 10.9 3 7.8V3.8L8 2Z" />
    <path d="M8 5.5V8.8" />
    <circle cx="8" cy="10.8" r="0.6" fill="currentColor" />
  </BaseSvg>
);

export const Cpu: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="4" y="4" width="8" height="8" rx="1" />
    <rect x="6.25" y="6.25" width="3.5" height="3.5" />
    <path d="M6 1.75V4M10 1.75V4M6 12V14.25M10 12V14.25M1.75 6H4M1.75 10H4M12 6H14.25M12 10H14.25" />
  </BaseSvg>
);

export const Server: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2" y="2.5" width="12" height="4.5" rx="1" />
    <rect x="2" y="9" width="12" height="4.5" rx="1" />
    <circle cx="4.5" cy="4.75" r="0.6" fill="currentColor" />
    <circle cx="4.5" cy="11.25" r="0.6" fill="currentColor" />
    <path d="M7.5 4.75H11.5M7.5 11.25H11.5" />
  </BaseSvg>
);

export const Database: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <ellipse cx="8" cy="3.8" rx="5.2" ry="1.8" />
    <path d="M2.8 3.8V12.2C2.8 13.2 5.1 14 8 14C10.9 14 13.2 13.2 13.2 12.2V3.8" />
    <path d="M2.8 8C2.8 9 5.1 9.8 8 9.8C10.9 9.8 13.2 9 13.2 8" />
  </BaseSvg>
);

export const HardDrive = Server;

export const Activity: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M1.5 8H4.2L6.2 3.2L9.8 12.8L11.8 8H14.5" />
  </BaseSvg>
);

export const Radio: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="8" cy="8" r="1.5" />
    <path d="M5.2 5.2C3.7 6.7 3.7 9.3 5.2 10.8M10.8 5.2C12.3 6.7 12.3 9.3 10.8 10.8" />
    <path d="M3.2 3.2C0.6 5.8 0.6 10.2 3.2 12.8M12.8 3.2C15.4 5.8 15.4 10.2 12.8 12.8" />
  </BaseSvg>
);

export const Flame: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M5 13.5C3.5 12 3.2 9.6 4.8 7.5C6.2 5.6 6.5 3.5 6.2 2C8.8 3.2 10.5 5.8 9.8 8.2C10.8 7.6 11.4 6.5 11.5 5.5C12.8 7.5 12.8 11.2 10.8 13.5H5Z" />
    <path d="M2.5 14.25H13.5" />
  </BaseSvg>
);

export const Wind: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2 6H11.5C12.6 6 13.5 5.1 13.5 4C13.5 2.9 12.6 2 11.5 2C10.5 2 9.7 2.7 9.5 3.6" />
    <path d="M2 9H13C13.8 9 14.5 9.7 14.5 10.5C14.5 11.3 13.8 12 13 12H11.5" />
    <path d="M2 12H8.5" />
  </BaseSvg>
);

export const Fan: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <circle cx="8" cy="8" r="1.6" />
    <path d="M8 3.5V6.4M8 9.6V12.5M3.5 8H6.4M9.6 8H12.5" />
  </BaseSvg>
);

export const Eye: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M1.75 8C3.1 5.1 5.4 3.75 8 3.75C10.6 3.75 12.9 5.1 14.25 8C12.9 10.9 10.6 12.25 8 12.25C5.4 12.25 3.1 10.9 1.75 8Z" />
    <circle cx="8" cy="8" r="2" />
  </BaseSvg>
);

export const EyeOff: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.2 2.2L13.8 13.8" />
    <path d="M6.2 4C6.8 3.8 7.4 3.75 8 3.75C10.6 3.75 12.9 5.1 14.25 8C13.6 9.3 12.8 10.3 11.8 11" />
    <path d="M4.2 5C3.2 5.7 2.4 6.7 1.75 8C3.1 10.9 5.4 12.25 8 12.25C8.8 12.25 9.5 12.1 10.2 11.8" />
  </BaseSvg>
);

export const Copy: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="5.5" y="5.5" width="8.25" height="8.25" rx="1.2" />
    <path d="M3.5 10.5H2.8C2.25 10.5 1.8 10.05 1.8 9.5V2.8C1.8 2.25 2.25 1.8 2.8 1.8H9.5C10.05 1.8 10.5 2.25 10.5 2.8V3.5" />
  </BaseSvg>
);

export const ClipboardPaste: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M5.5 2.5H3.5C2.95 2.5 2.5 2.95 2.5 3.5V13C2.5 13.55 2.95 14 3.5 14H12.5C13.05 14 13.5 13.55 13.5 13V3.5C13.5 2.95 13.05 2.5 12.5 2.5H10.5" />
    <rect x="5.5" y="1.5" width="5" height="2.2" rx="0.6" />
    <path d="M5.5 8.5H10.5M5.5 11H8.5" />
  </BaseSvg>
);

export const ClipboardList = ClipboardPaste;

export const Trash2: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.5 4.25H13.5" />
    <path d="M6 4.25V2.75C6 2.34 6.34 2 6.75 2H9.25C9.66 2 10 2.34 10 2.75V4.25" />
    <path d="M4 4.25L4.6 13.25C4.65 13.8 5.1 14.25 5.65 14.25H10.35C10.9 14.25 11.35 13.8 11.4 13.25L12 4.25" />
    <path d="M6.75 7V11.5M9.25 7V11.5" />
  </BaseSvg>
);

export const FolderOpen: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2 4C2 3.45 2.45 3 3 3H6.2L7.7 4.8H13C13.55 4.8 14 5.25 14 5.8V12.2C14 12.75 13.55 13.2 13 13.2H3C2.45 13.2 2 12.75 2 12.2V4Z" />
    <path d="M2 7H14" />
  </BaseSvg>
);

export const FolderGit2 = FolderOpen;

export const FileCode: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M9.5 2H4C3.45 2 3 2.45 3 3V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V5.5L9.5 2Z" />
    <path d="M9.5 2V5.5H13" />
    <path d="M6.8 8.2L5.2 9.6L6.8 11M9.2 8.2L10.8 9.6L9.2 11" />
  </BaseSvg>
);

export const FileText: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M9.5 2H4C3.45 2 3 2.45 3 3V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V5.5L9.5 2Z" />
    <path d="M9.5 2V5.5H13" />
    <path d="M5.5 8H10.5M5.5 10.5H9" />
  </BaseSvg>
);

export const FileCheck: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M9.5 2H4C3.45 2 3 2.45 3 3V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V5.5L9.5 2Z" />
    <path d="M9.5 2V5.5H13" />
    <path d="M5.8 9.6L7.3 11.1L10.4 8" />
  </BaseSvg>
);

export const Search: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="7.2" cy="7.2" r="4.6" />
    <path d="M10.6 10.6L13.8 13.8" />
  </BaseSvg>
);

export const Filter: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <polygon points="2,3 14,3 9.4,8.4 9.4,13.2 6.6,12 6.6,8.4" />
  </BaseSvg>
);

export const Move: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 2V14M2 8H14" />
    <path d="M6 3.8L8 1.8L10 3.8M6 12.2L8 14.2L10 12.2M3.8 6L1.8 8L3.8 10M12.2 6L14.2 8L12.2 10" />
  </BaseSvg>
);

export const Maximize2: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M9.5 2.5H13.5V6.5M6.5 13.5H2.5V9.5M13.5 2.5L9.2 6.8M2.5 13.5L6.8 9.2" />
  </BaseSvg>
);

export const Crosshair: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="8" cy="8" r="5.2" />
    <path d="M8 1.5V4.5M8 11.5V14.5M1.5 8H4.5M11.5 8H14.5" />
  </BaseSvg>
);

export const Target = Crosshair;

export const Compass: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="8" cy="8" r="5.75" />
    <polygon points="6.5,6.5 10.8,5.2 9.5,9.5 5.2,10.8" />
  </BaseSvg>
);

export const Clock: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="8" cy="8" r="5.75" />
    <path d="M8 4.75V8.25L10.5 9.75" />
  </BaseSvg>
);

export const Calendar: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="1.5" />
    <path d="M5 2V4.2M11 2V4.2M2.25 6.5H13.75" />
  </BaseSvg>
);

export const CalendarClock = Calendar;

export const FastForward: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <polygon points="2.2,3.5 8,8 2.2,12.5" />
    <polygon points="8.2,3.5 14,8 8.2,12.5" />
  </BaseSvg>
);

export const MessageSquare: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.5 3.5C2.5 2.95 2.95 2.5 3.5 2.5H12.5C13.05 2.5 13.5 2.95 13.5 3.5V10.5C13.5 11.05 13.05 11.5 12.5 11.5H6L2.5 14V3.5Z" />
    <path d="M5.2 6H10.8M5.2 8.5H8.8" />
  </BaseSvg>
);

export const Send: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <polygon points="13.8,2.2 7.2,13.8 5.8,8.8 1.8,6.8" />
    <path d="M13.8 2.2L5.8 8.8" />
  </BaseSvg>
);

export const BookOpen: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 3.8C6.6 2.9 4.5 2.6 2 3V12.5C4.5 12.1 6.6 12.4 8 13.3C9.4 12.4 11.5 12.1 14 12.5V3C11.5 2.6 9.4 2.9 8 3.8Z" />
    <path d="M8 3.8V13.3" />
  </BaseSvg>
);

export const Image: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="1.5" />
    <circle cx="5.6" cy="5.6" r="1.1" />
    <path d="M2.5 11.5L6.2 8L9.2 10.8L11.2 9L13.75 11.5" />
  </BaseSvg>
);

export const Printer = IconNozzle;

export const ShoppingBag: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2.75" y="5" width="10.5" height="9" rx="1.2" />
    <path d="M5.5 5V3.8C5.5 2.6 6.6 1.8 8 1.8C9.4 1.8 10.5 2.6 10.5 3.8V5" />
  </BaseSvg>
);

export const ShoppingCart: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M1.75 2.5H3.6L5.1 10.2H12.4L13.8 4.5H4.2" />
    <circle cx="5.8" cy="13" r="1.1" />
    <circle cx="11.6" cy="13" r="1.1" />
  </BaseSvg>
);

export const Store: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.5 6.5V13.5H13.5V6.5" />
    <polygon points="1.8,6.5 3.2,2.5 12.8,2.5 14.2,6.5" />
    <path d="M6.2 13.5V9.5H9.8V13.5" />
  </BaseSvg>
);

export const Building: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="3" y="2" width="10" height="12" rx="1" />
    <path d="M5.5 5H7M9 5H10.5M5.5 7.8H7M9 7.8H10.5M6.5 14V11H9.5V14" />
  </BaseSvg>
);

export const Building2 = Building;

export const Landmark: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <polygon points="8,2 14,5.2 2,5.2" />
    <path d="M3.8 5.2V11.8M6.6 5.2V11.8M9.4 5.2V11.8M12.2 5.2V11.8M2 13.8H14M2.8 11.8H13.2" />
  </BaseSvg>
);

export const Home: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.2 7.2L8 2.2L13.8 7.2" />
    <path d="M3.8 6V13.5H12.2V6" />
  </BaseSvg>
);

export const Lock: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="3.25" y="7" width="9.5" height="6.8" rx="1.2" />
    <path d="M5.25 7V4.8C5.25 3.3 6.4 2.2 8 2.2C9.6 2.2 10.75 3.3 10.75 4.8V7" />
  </BaseSvg>
);

export const Unlock: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="3.25" y="7" width="9.5" height="6.8" rx="1.2" />
    <path d="M5.25 7V4.5C5.25 3 6.4 2 8 2C9.3 2 10.3 2.7 10.6 3.8" />
  </BaseSvg>
);

export const BarChart3: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.5 13.5H13.5" />
    <rect x="3.5" y="8" width="2" height="5.5" />
    <rect x="7" y="4.5" width="2" height="9" />
    <rect x="10.5" y="2.5" width="2" height="11" />
  </BaseSvg>
);

export const TrendingUp: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2 11.5L6.2 7.3L9.2 10.3L14 4.5" />
    <path d="M10.2 4.5H14V8.3" />
  </BaseSvg>
);

export const GitBranch: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="4.5" cy="4" r="1.5" />
    <circle cx="4.5" cy="12" r="1.5" />
    <circle cx="11.5" cy="6" r="1.5" />
    <path d="M4.5 5.5V10.5M11.5 7.5C11.5 9.5 9.5 10 4.5 10" />
  </BaseSvg>
);

export const GitCompare = GitBranch;

export const Users: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="6.2" cy="5.2" r="2.3" />
    <path d="M2.2 13.2C2.2 10.8 4 9.2 6.2 9.2C8.4 9.2 10.2 10.8 10.2 13.2" />
    <circle cx="11.2" cy="5.8" r="1.8" />
    <path d="M11.2 9.5C12.8 9.7 14 11 14 13.2" />
  </BaseSvg>
);

export const User: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="8" cy="5.2" r="2.6" />
    <path d="M3 13.5C3 10.8 5.2 9.2 8 9.2C10.8 9.2 13 10.8 13 13.5" />
  </BaseSvg>
);

export const UserCheck: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="6.5" cy="5.2" r="2.4" />
    <path d="M2.2 13.5C2.2 11 4.1 9.4 6.5 9.4C8.9 9.4 10.8 11 10.8 13.5" />
    <path d="M10.8 7.8L12.1 9.1L14.4 6.6" />
  </BaseSvg>
);

export const UserPlus: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="6.5" cy="5.2" r="2.4" />
    <path d="M2.2 13.5C2.2 11 4.1 9.4 6.5 9.4C8.9 9.4 10.8 11 10.8 13.5" />
    <path d="M12.5 5.8V9.8M10.5 7.8H14.5" />
  </BaseSvg>
);

export const Wrench: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M10.2 2.5C8.6 2.5 7.3 3.8 7.3 5.4C7.3 5.9 7.4 6.4 7.6 6.8L2.6 11.8C2.1 12.3 2.1 13.1 2.6 13.6C3.1 14.1 3.9 14.1 4.4 13.6L9.4 8.6C9.8 8.8 10.3 8.9 10.8 8.9C12.4 8.9 13.7 7.6 13.7 6L11.6 8.1L9.9 6.4L12 4.3C11.5 3.2 10.9 2.5 10.2 2.5Z" />
  </BaseSvg>
);

export const Cog = Cpu;

export const Palette: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2" />
    <path d="M2.25 8H13.75M8 2.25V13.75" />
    <circle cx="5.1" cy="5.1" r="1" fill="currentColor" />
  </BaseSvg>
);

export const Package = IconCube;

export const PackageCheck: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 1.75L13.75 5V9.5M8 14.25L2.25 11V5L8 1.75Z" />
    <path d="M8 8V14.25M8 8L13.75 5M8 8L2.25 5" />
    <path d="M10.2 12L11.6 13.4L14.2 10.6" />
  </BaseSvg>
);

export const Plus: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 3V13M3 8H13" />
  </BaseSvg>
);

export const Minus: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M3 8H13" />
  </BaseSvg>
);

export const PlusCircle: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2.5" />
    <path d="M8 5V11M5 8H11" />
  </BaseSvg>
);

export const MinusCircle: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2.5" />
    <path d="M5 8H11" />
  </BaseSvg>
);

export const Edit2: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M10.8 2.4L13.6 5.2L5.4 13.4H2.6V10.6L10.8 2.4Z" />
  </BaseSvg>
);

export const Edit3 = Edit2;

export const Save: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M3 2.5H11.2L13.5 4.8V13C13.5 13.55 13.05 14 12.5 14H3C2.45 14 2 13.55 2 13V3.5C2 2.95 2.45 2.5 3 2.5Z" />
    <rect x="5" y="2.5" width="5" height="3.5" />
    <rect x="4.5" y="9" width="7" height="5" />
  </BaseSvg>
);

export const CreditCard: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="1.75" y="3.5" width="12.5" height="9" rx="1.4" />
    <path d="M1.75 6.8H14.25M4.2 10H7.2" />
  </BaseSvg>
);

export const Wallet: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2" y="3.5" width="12" height="9.5" rx="1.4" />
    <path d="M10 8.25H14" />
    <circle cx="11.2" cy="8.25" r="0.7" fill="currentColor" />
  </BaseSvg>
);

export const Coins: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="6.5" cy="6.5" r="4" />
    <path d="M9.5 6.8C11.4 7.3 12.8 8.9 12.8 10.8C12.8 12.6 10.6 13.8 8.2 13.2" />
  </BaseSvg>
);

export const DollarSign: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 2V14" />
    <path d="M10.8 4.8H6.5C5.4 4.8 4.5 5.6 4.5 6.6C4.5 7.6 5.4 8.2 6.5 8.2H9.5C10.6 8.2 11.5 9 11.5 10C11.5 11 10.6 11.8 9.5 11.8H4.8" />
  </BaseSvg>
);

export const Tag: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.5 8.2V3C2.5 2.7 2.7 2.5 3 2.5H8.2L13.5 7.8L8.2 13.1L2.5 8.2Z" />
    <circle cx="5.2" cy="5.2" r="0.8" fill="currentColor" />
  </BaseSvg>
);

export const Star: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <polygon points="8,2 10,6 14,6.5 11,9.5 11.8,13.8 8,11.6 4.2,13.8 5,9.5 2,6.5 6,6" />
  </BaseSvg>
);

export const ThumbsUp: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M6 7.2L8.2 2.5C9 2.5 9.6 3.1 9.6 4V6.5H13.2L12.2 13H5.5V7.2H6Z" />
    <rect x="2.5" y="7.2" width="3" height="5.8" />
  </BaseSvg>
);

export const Truck: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="1.75" y="3.5" width="8.5" height="7.5" />
    <polygon points="10.25,5.5 13,5.5 14.25,8 14.25,11 10.25,11" />
    <circle cx="4.5" cy="12.5" r="1.4" />
    <circle cx="11.8" cy="12.5" r="1.4" />
  </BaseSvg>
);

export const Ship: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.2 9.5L8 7.5L13.8 9.5L12.2 13H3.8L2.2 9.5Z" />
    <path d="M5 8.2V4.5H11V8.2M8 2.5V4.5" />
  </BaseSvg>
);

export const Link2: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M6.5 10.5H4.5C3.1 10.5 2 9.4 2 8C2 6.6 3.1 5.5 4.5 5.5H6.5" />
    <path d="M9.5 5.5H11.5C12.9 5.5 14 6.6 14 8C14 9.4 12.9 10.5 11.5 10.5H9.5" />
    <path d="M5.5 8H10.5" />
  </BaseSvg>
);

export const Unlink: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M6.5 10.5H4.5C3.1 10.5 2 9.4 2 8C2 6.6 3.1 5.5 4.5 5.5H6.5" />
    <path d="M9.5 5.5H11.5C12.9 5.5 14 6.6 14 8C14 9.4 12.9 10.5 11.5 10.5H9.5" />
    <path d="M6 2.5L10 13.5" />
  </BaseSvg>
);

export const Globe: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <circle cx="8" cy="8" r="5.75" />
    <ellipse cx="8" cy="8" rx="2.6" ry="5.75" />
    <path d="M2.25 8H13.75" />
  </BaseSvg>
);

export const Grid = IconArchive;

export const Ruler: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2" y="5.5" width="12" height="5" rx="0.8" />
    <path d="M4.5 5.5V8M7 5.5V7.2M9.5 5.5V8M12 5.5V7.2" />
  </BaseSvg>
);

export const Calculator: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="3" y="2" width="10" height="12" rx="1.4" />
    <rect x="4.8" y="3.8" width="6.4" height="2.4" />
    <path d="M5.2 8.5H6.2M7.8 8.5H8.8M10.2 8.5H11.2M5.2 11.2H6.2M7.8 11.2H8.8M10.2 11.2H11.2" />
  </BaseSvg>
);

export const Weight: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <polygon points="3.8,5.5 12.2,5.5 13.6,13.5 2.4,13.5" />
    <circle cx="8" cy="3.8" r="1.6" />
  </BaseSvg>
);

export const FlaskConical: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M6 2.2H10M6.8 2.2V6L3 12.6C2.6 13.2 3.1 14 3.8 14H12.2C12.9 14 13.4 13.2 13 12.6L9.2 6V2.2" />
    <path d="M4.8 10.2H11.2" />
  </BaseSvg>
);

export const Phone: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M4.5 2.5H6.8L7.8 5.2L6.2 6.5C7 8.2 7.8 9 9.5 9.8L10.8 8.2L13.5 9.2V11.5C13.5 12.6 12.5 13.5 11.2 13.5C6.2 13.2 2.8 9.8 2.5 4.8C2.5 3.5 3.4 2.5 4.5 2.5Z" />
  </BaseSvg>
);

export const Mail: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2" y="3.5" width="12" height="9" rx="1.2" />
    <path d="M2.2 4.2L8 8.5L13.8 4.2" />
  </BaseSvg>
);

export const MapPin: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 14C8 14 12.5 10.2 12.5 6.5C12.5 4 10.5 2 8 2C5.5 2 3.5 4 3.5 6.5C3.5 10.2 8 14 8 14Z" />
    <circle cx="8" cy="6.5" r="1.6" />
  </BaseSvg>
);

export const QrCode: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="2.2" y="2.2" width="4.4" height="4.4" />
    <rect x="9.4" y="2.2" width="4.4" height="4.4" />
    <rect x="2.2" y="9.4" width="4.4" height="4.4" />
    <path d="M9.4 9.4H11.4V11.4H9.4V9.4ZM11.8 11.8H13.8V13.8H11.8V11.8ZM13.8 9.4V10.8M9.4 13.8H10.8" />
  </BaseSvg>
);

export const Smartphone: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <rect x="4.2" y="1.8" width="7.6" height="12.4" rx="1.4" />
    <path d="M7 11.8H9" />
  </BaseSvg>
);

export const Menu: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M2.5 4.5H13.5M2.5 8H13.5M2.5 11.5H13.5" />
  </BaseSvg>
);

export const LogIn: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M9.5 2.5H12.5C13.05 2.5 13.5 2.95 13.5 3.5V12.5C13.5 13.05 13.05 13.5 12.5 13.5H9.5" />
    <path d="M2.5 8H10.5M7.5 5L10.5 8L7.5 11" />
  </BaseSvg>
);

export const LogOut: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M6.5 2.5H3.5C2.95 2.5 2.5 2.95 2.5 3.5V12.5C2.5 13.05 2.95 13.5 3.5 13.5H6.5" />
    <path d="M6 8H13.5M10.5 5L13.5 8L10.5 11" />
  </BaseSvg>
);

export const Loader2: React.FC<IconProps> = (props) => (
  <BaseSvg {...props}>
    <path d="M8 2.25C11.18 2.25 13.75 4.82 13.75 8C13.75 11.18 11.18 13.75 8 13.75C4.82 13.75 2.25 11.18 2.25 8" />
  </BaseSvg>
);
