# 言 (Yan) - 仿X风格社交平台

<p align="center">
  <img src="https://img.shields.io/github/v/release/coolkun999/yan" alt="GitHub release" />
  <img src="https://img.shields.io/github/license/coolkun999/yan" alt="License" />
</p>

仿 Twitter/X 风格的社交平台 Web 应用，已打包为 Android APP。

---

## 🖥️ 在线体验

直接访问 GitHub Pages：[https://coolkun999.github.io/yan](https://coolkun999.github.io/yan)

---

## 📱 Android APP 构建指南

### 前置要求
- Android Studio（推荐最新版）
- Android SDK
- JDK 17+

### 构建步骤

1. **克隆仓库**
```bash
git clone https://github.com/coolkun999/yan.git
cd yan
```

2. **安装依赖**
```bash
npm install
```

3. **同步 Capacitor**
```bash
npx cap sync android
```

4. **打开 Android Studio 构建 APK**
```bash
# 用 Android Studio 打开 android/ 文件夹
# Android Studio 会自动下载 Gradle
# 点击 Run → Build APK(s) → Build APK(s)
```

5. **找到 APK 文件**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 📲 安装到手机

APK 文件生成后：
- 传到手机直接安装（需要开启"允许安装未知来源APP"）
- 或用 `adb install app-debug.apk` 安装

---

## 🎨 功能列表

- ✅ 主页 Timeline（为你推荐 / 正在关注）
- ✅ 探索页（热搜 + 分类 Tab）
- ✅ 通知系统
- ✅ 私信聊天
- ✅ 个人资料页（6个Tab）
- ✅ 热门话题详情页
- ✅ 社群（推荐 / 我的社群）
- ✅ 列表（创建 / 详情 / 成员）
- ✅ 创作者中心 / 广告中心 / Spaces
- ✅ 主题切换（深色 / 浅色 / 暗淡）
- ✅ 搜索（用户 + 帖子）
- ✅ 书签功能
- ✅ 右则边栏（Premium + 话题 + 推荐关注）

---

## 🛠️ 技术栈

- 纯前端 HTML/CSS/JavaScript（无框架）
- Capacitor 打包为 Android APP
- localStorage 本地持久化

---

## 📂 项目结构

```
yan/
├── index.html          # 主页面
├── android/           # Android 原生项目（用 Android Studio 打开）
├── capacitor.config.json
└── package.json
```

---

Made with ❤️ by 坤哥云端龙虾 🦞
