# AGENTS

本檔案提供給自動化工具或協作代理（Agents）使用，
目標是**維持專案的核心約束**與**正確的整合流程**。

---

## 專案定位

* Vue3 為 Host / Shell
* Vue2 為 Legacy Feature App（iframe 載入）
* 登入流程 **必須維持 URL query token**

---

## 絕對不可變更（Hard Constraints）

1. Vue2 登入仍以 URL query token 為唯一入口
2. Vue2 仍為「是否已登入」的最終判定者
3. 不可移除 URL token
4. 不可要求 Vue2 改為純 message 登入

---

## 可新增範圍（Allowed Enhancements）

1. Vue3 可產生 token 並帶入 iframe URL
2. Vue3 / Vue2 可透過 bridge 同步登入狀態
3. Vue2 可在登入完成後回報 READY / AUTH_READY

---

## Bridge 訊息規格（修正版）

```ts
type BridgeMessage =
  | { type: 'READY' }
  | { type: 'AUTH_READY'; user: any }
  | { type: 'NAVIGATE'; route: string }
  | { type: 'STATE_SYNC'; key: string; value: any }
  | { type: 'EVENT'; name: string; payload?: any }
```

> AUTH_SYNC 不再作為主要登入手段。

---

## 登入流程（不可改）

1. Vue3 取得 token
2. Vue3 iframe URL 帶入 token
3. Vue2 解析 URL token 並依原流程登入
4. Vue2 登入成功後送出 AUTH_READY
5. Vue3 接收 AUTH_READY 並更新 UI

---

## 任何修改前的檢核

* 是否維持 URL token 登入流程？
* 是否仍由 Vue2 判定登入狀態？
* 是否僅使用 bridge 作為狀態回報與導航？

---

## 建議產出（可選）

* shared-bridge/protocol.ts（最小可用版本）
* 登入流程時序圖
