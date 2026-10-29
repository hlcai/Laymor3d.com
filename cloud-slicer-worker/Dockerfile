# ==============================================================================
# Laymor3D Headless Cloud Slicer Worker (OrcaSlicer / Bambu Studio Engine Core)
# Chạy không cần FUSE (--appimage-extract) + Xvfb ảo trên Railway / Fly.io / Cloud Run / VPS
# ==============================================================================
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive \
    ORCA_VERSION=2.2.0 \
    PORT=8090 \
    NODE_ENV=production

# 1. Cài đặt thư viện đồ họa Headless Xvfb, Mesa OpenGL/EGL & Node.js 20 LTS
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    unzip \
    xvfb \
    xauth \
    dbus-x11 \
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    libegl1-mesa \
    libglu1-mesa \
    libgtk-3-0 \
    libglib2.0-0 \
    libgdk-pixbuf2.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libfontconfig1 \
    libfreetype6 \
    libx11-6 \
    libxext6 \
    libxrender1 \
    libxtst6 \
    libxi6 \
    libxkbcommon0 \
    libwayland-client0 \
    libsecret-1-0 \
    libsoup2.4-1 \
    libwebkit2gtk-4.0-37 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# 2. Tải & Giải nén OrcaSlicer AppImage (Nhân C++ libslic3r + TreeSupport 2.0 đồng bộ 100% Bambu Studio)
WORKDIR /opt
RUN curl -fL "https://github.com/SoftFever/OrcaSlicer/releases/download/v${ORCA_VERSION}/OrcaSlicer_Linux_V${ORCA_VERSION}.AppImage" \
    -o /tmp/orcaslicer.AppImage \
    && chmod +x /tmp/orcaslicer.AppImage \
    && /tmp/orcaslicer.AppImage --appimage-extract \
    && mv /opt/squashfs-root /opt/orcaslicer \
    && rm -f /tmp/orcaslicer.AppImage

ENV SLICER_BIN="/opt/orcaslicer/AppRun"

# 3. Khởi tạo thư mục dịch vụ Worker
WORKDIR /app
COPY gcodeBinaryPacker.mjs /app/gcodeBinaryPacker.mjs
COPY server.mjs /app/server.mjs

RUN mkdir -p /tmp/laymor_slices && chmod 777 /tmp/laymor_slices

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=8s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8090/health || exit 1

CMD ["node", "/app/server.mjs"]
