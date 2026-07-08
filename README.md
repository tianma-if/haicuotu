# 📖 《海错图》数字化图鉴 (Digitalized Haicuotu)

> **对清代聂璜绘制的海洋生物奇书《海错图》进行 100% 精准的“单图-单物种”数字化映射与对齐审计项目。**

---

## 🎯 项目定位 (Positioning)

《海错图》是由清代画家聂璜绘制的海洋生物图谱，共分四册，记载了 300 余种光怪陆离的真实与传说海洋生物。然而，传统 OCR 排版分析工具（如 Mineru 等）在处理中国古籍时面临以下挑战：
* **竖排繁体字**与从右至左的古籍排版导致阅读流识别错乱；
* **单页多插图无框混排**导致大模型无法准确分离出单个物种；
* **图文位置错配**（例如将飞鱼错配给铜盆鱼，将海驴错配给虎鲨）。

**本项目致力于通过“半自动 OCR + 手工校对映射表 + 高精度裁剪算子”的闭环审计流，重建一套 100% 精确无误的数字化《海错图》数据库，确保每一个物种卡片只展示正确、单一、无杂质的清代原画插图。**

---

## 🛠️ 技术栈 (Tech Stack)

本项目采用现代前端与 Python 数据流工具链构建：

1. **前端与样式 (Frontend & Styling)**:
   * **[Astro v7.0](https://astro.build/)** + **React 19** + **TailwindCSS v4** + **TypeScript**

2. **数据与裁剪流水线 (Data & Image Pipeline)**:
   * **Python 3 + PyMuPDF (fitz)**: 直接读取故宫博物院高分辨率 PDF 页面并渲染成无损像素缓存。
   * **Pillow (PIL)**: 提供精确的横向/纵向切片算子（如 `left`、`right`、`third_1/2/3`、`quarter_1/2/3/4`），将多物种混合图切分为独立的 WebP 格式物种图片。
   * **静态 JSON 数据库**: 数据预先编译进 `src/data/vol[1-4].json`，无需额外数据库服务器。

---

## 🚀 项目结构 (Project Structure)

```text
haicuotu/
├── public/
│   └── images/              # 自动裁剪生成的高清物种 WebP 切片 (vol1 - vol4)
├── raw-pdfs/                # 本地原始 PDF 放置目录（PDF 文件不提交 Git）
├── scripts/
│   ├── rebuild_accurate_database.py  # 核心：高精度切片算子与数据库重建脚本 (Venv 依赖 fitz/Pillow)
│   └── curate_haicuotu.py            # 数据文本微调与润色辅助脚本
├── src/
│   ├── data/                # 编译生成的静态 JSON 数据库 (已完全对齐 279 个物种)
│   │   ├── vol1.json
│   │   ├── vol2.json
│   │   ├── vol3.json
│   │   └── vol4.json
│   ├── components/          # React 与 Astro UI 组件
│   └── pages/               # Astro 动态路由与页面
└── package.json
```

---

## 🚀 运行指南 (Commands)

### 1. 安装前端依赖
```sh
bun install
```

### 2. 启动开发服务器 (Astro 后台运行模式)
```sh
bun x astro dev --background
```
* 查看状态：`bun x astro dev status`
* 查看日志：`bun x astro dev logs`
* 停止服务：`bun x astro dev stop`

### 3. 重建并对齐图片数据库 (需激活 `.venv` 虚拟环境)
先从书格《海错图》页面下载四册原始 PDF：<https://www.shuge.org/view/hai_cuo_tu/>。下载后将 PDF 文件放入 `raw-pdfs/`。PDF 文件体积较大，不纳入 Git 版本控制；目录内的说明文件会保留在仓库中。

```sh
.venv/bin/python3 scripts/rebuild_accurate_database.py
```

如需从其它目录读取 PDF，可设置：

```sh
HAICUOTU_PDF_DIR=/path/to/pdf-folder .venv/bin/python3 scripts/rebuild_accurate_database.py
```

### 4. 编译静态站点 (Production Build)
```sh
bun run build
```

---

## 🚀 当前数据库审计状态 (Audit Summary)

| 卷册 | 原始 PDF 文件名 | 核验独立物种数 | 对齐状态 |
| :--- | :--- | :--- | :--- |
| **第一册** | `海错图.第一册.三十五开.清.聂璜绘.北京故宫` | 72 | ✅ 100% 精确对齐 (单图单鱼) |
| **第二册** | `海错图.第二册.三十七开.清.聂璜绘.北京故宫` | 70 | ✅ 100% 精确对齐 (单图单鱼) |
| **第三册** | `海错图.第三册.三十九开.清.聂璜绘.北京故宫` | 20 | ✅ 100% 精确对齐 (海鸟与贝类) |
| **第四册** | `海错图.第四册.四十四开.清.聂璜绘.台北故宫` | 117 | ✅ 100% 精确对齐 (虾蟹螺贝) |
| **合计** | | **279 个独立图鉴** | **✅ 100% 完整收录并消除多物种同框** |

---

## 📝 开发与对齐踩坑记录 (Development Lessons)

关于本项目在古籍排版对齐、PDF 偏移量、多物种同框分栏裁切及繁简异体字匹配等开发迭代中遇到的典型技术挑战与解决方案，请参阅独立的 [DEVELOPMENT_LESSONS.md](file:///Users/tianma/Developer/Projects/haicuotu/DEVELOPMENT_LESSONS.md) 说明文档。
