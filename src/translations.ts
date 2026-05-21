/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'zh' | 'en';

export const TRANSLATIONS = {
  zh: {
    // Header
    appName: "EcoSim 3D 生態模擬器",
    engineVersion: "v1.1.0 - 3D 物理引擎",
    simulationStatus: "模擬運行狀態",
    statusPaused: "模擬已暫停",
    statusRunning: "物理運行中 • 60 FPS",
    activeAgents: "活動群落個體",
    entities: "生物個體",
    triggerCataclysm: "觸發大災變",

    // Alerts & Overlay
    bioDisasterEvent: "生化危機大災變已爆發：偵測到生物群落大範圍消亡！",
    biosphereFrozen: "虛擬生態圈運行已凍結",

    // HUD
    biodiversity: "物種多樣性分佈",
    speciesLiving: "個活躍物種",
    totalPopulation: "總群落個體數量",
    organisms: "個個體",

    // Sidebar Header
    ecoChamberTitle: "3D 精密生態模擬控制台",
    ecoChamberSubtitle: "生物鏈微氣候仿真調解腔體",

    // Stats
    cycle: "物理週期",
    demises: "消亡個體數",
    emergences: "繁殖誕生數",

    // Census & Spawn
    censusTitle: "物種資源分佈與人工投放",
    floraGrass: "植物 / 綠藻",
    insectBug: "昆蟲 / 爬蟲",
    herbivoreFlock: "草食動物 (群居)",
    birdFlight: "鳥類 (翱翔)",
    carnivoreWolf: "肉食掠食者 (野狼)",
    
    plant: "植物",
    insect: "昆蟲",
    herbivore: "草食動物",
    bird: "鳥類",
    carnivore: "肉食掠食者",

    // Controls
    controlsTitle: "生態核心控制面板",
    resume: "恢復模擬",
    freeze: "暫停凍結",
    step: "單步微調",
    reset: "重設生態",
    simulationVelocity: "模擬物理引擎更新速率",
    ticksFrame: "運算更新/渲染幀",
    cataclysmSeverity: "生物消亡清洗強度",
    purged: "個體將被清除",
    triggerDisasterBtn: "發動大規模生態災難",

    // Tabs
    tabBreeding: "繁衍與上限",
    tabVelocities: "運動速度",
    tabAttributes: "代謝與感知",

    // Rates Tab
    floraSelfGrowth: "植物自體自發增長頻率",
    floraPopCap: "植物實體存在數量上限",
    cubesLabel: "個方塊",
    reproUrge: "生物繁衍意願頻率",
    reproThreshold: "繁衍所需飽食度閾值",
    fullLabel: "飽滿度",

    // Speeds Tab
    insectCrawlerSpeed: "昆蟲最大爬行速率",
    herbivoreRunnerSpeed: "草食群落奔行速率",
    birdFlyerSpeed: "空域翱翔滑翔最高速度",
    carnivoreHunterSpeed: "野狼飛奔掠食最高速度",

    // Vision/Attributes Tab
    carnivoreVision: "肉食者掠食捕獵視野半徑",
    herbivoreMetabolism: "草食群落飢餓耗能強度",
    carnivoreMetabolism: "肉食掠食飢餓耗能強度",
    boidsCohesion: "草食群居向心聚合力強度",

    // Sidebar footer
    simStable: "生態仿真矩陣 運行穩定",
    matrixActive: "模擬單元工作正常",

    // Chart
    chartTitle: "生態種群 Lotka-Volterra 波動曲線"
  },
  en: {
    // Header
    appName: "EcoSim 3D Biosphere",
    engineVersion: "v1.1.0 - 3D Engine",
    simulationStatus: "Simulation Status",
    statusPaused: "PAUSED",
    statusRunning: "RUNNING • 60 FPS",
    activeAgents: "Active Agents",
    entities: "Entities",
    triggerCataclysm: "Trigger Cataclysm",

    // Alerts & Overlay
    bioDisasterEvent: "BIO-DISASTER EVENT INITIATED: MASSIVE POPULATION PURGE DETECTED",
    biosphereFrozen: "BIOSPHERE SIMULATION FROZEN",

    // HUD
    biodiversity: "Biodiversity",
    speciesLiving: "Species Living",
    totalPopulation: "Total Population",
    organisms: "Organisms",

    // Sidebar Header
    ecoChamberTitle: "3D Eco-Chain Chamber",
    ecoChamberSubtitle: "Biodynamic Chamber Simulation",

    // Stats
    cycle: "cycle",
    demises: "Demises",
    emergences: "Emergences",

    // Census & Spawn
    censusTitle: "Species Census & Injections",
    floraGrass: "flora / grass",
    insectBug: "insect / bug",
    herbivoreFlock: "herbivore (flock)",
    birdFlight: "bird (flight)",
    carnivoreWolf: "carnivore / wolf",
    
    plant: "Plant",
    insect: "Insect",
    herbivore: "Herbivore",
    bird: "Bird",
    carnivore: "Carnivore",

    // Controls
    controlsTitle: "Operational Controls",
    resume: "RESUME",
    freeze: "FREEZE",
    step: "STEP",
    reset: "RESET",
    simulationVelocity: "Simulation Velocity",
    ticksFrame: "Ticks/frame",
    cataclysmSeverity: "Cataclysm Severity",
    purged: "Purged",
    triggerDisasterBtn: "Trigger disaster",

    // Tabs
    tabBreeding: "Breeding",
    tabVelocities: "Velocities",
    tabAttributes: "Attributes",

    // Rates Tab
    floraSelfGrowth: "Flora Self-Growth frequency",
    floraPopCap: "Flora Capsule Pop Cap",
    cubesLabel: "cubes",
    reproUrge: "Reproduction Urge frequency",
    reproThreshold: "Breeding Hunger Threshold",
    fullLabel: "% full",

    // Speeds Tab
    insectCrawlerSpeed: "Insect Crawler maximum speed",
    herbivoreRunnerSpeed: "Herbivore Runner maximum speed",
    birdFlyerSpeed: "Bird Flyer maximum speed",
    carnivoreHunterSpeed: "Carnivore Hunter maximum speed",

    // Vision/Attributes Tab
    carnivoreVision: "Carnivore Hunting Vision radius",
    herbivoreMetabolism: "Herbivore metabolic exhaustion",
    carnivoreMetabolism: "Carnivore metabolic exhaustion",
    boidsCohesion: "Boids Herd cohesion strength",

    // Sidebar footer
    simStable: "Simulation Stable Active",
    matrixActive: "Matrix Active",

    // Chart
    chartTitle: "Lotka-Volterra Population Fluctuations"
  }
};
