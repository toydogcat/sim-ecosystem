# 3D 生物生態模擬實驗 (3D Ecosystem Simulator)

這是一個使用 React、Three.js 和 Tailwind CSS 開發的 3D 生態系統模擬器。你可以觀察植物、昆蟲、草食動物、鳥類和肉食動物在一個動態環境中的互動。

[Demo](https://toydogcat.github.io/sim-ecosystem/)

## 特色

- **3D 視覺化**：使用 Three.js 呈現的動態生態環境。
- **多物種互動**：模擬捕食、繁殖和能量循環。
- **即時參數調整**：可以調整物種的移動速度、感應範圍、繁殖率等參數。
- **數據統計**：提供即時的數量變化圖表。
- **多語言支持**：支持繁體中文和英文。

## 在 GitHub Pages 上預覽

本專案已配置為可自動部署到 GitHub Pages。

## 本地開發

### 前置需求

- Node.js (建議版本 18+)

### 安裝步驟

1. 安裝依賴：
   ```bash
   npm install
   ```

2. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

3. 建立生產版本：
   ```bash
   npm run build
   ```

## 部署到 GitHub Pages

1. 將此專案推送到您的 GitHub 儲存庫。
2. 在 GitHub 儲存庫的 **Settings > Pages** 中：
   - 將 **Build and deployment > Source** 設置為 **GitHub Actions**。
3. 每次推送到 `main` 分支時，GitHub Actions 會自動建置並部署您的模擬實驗。

## 授權條款

SPDX-License-Identifier: Apache-2.0
