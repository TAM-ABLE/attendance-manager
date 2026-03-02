// lib/task-categories.ts
// タスクカテゴリ定義と検索ユーティリティ

export const TASK_CATEGORIES = [
  {
    name: "開発",
    // --chart-4: oklch(0.75 0.08 60) — warm amber
    unselected:
      "bg-chart-4/15 text-chart-4 border border-chart-4/30 hover:bg-chart-4/25 hover:border-chart-4/50",
    selected: "bg-chart-4 text-white border border-chart-4",
    tasks: [
      "環境構築",
      "DB設計",
      "UI/UX設計",
      "機能開発",
      "API開発",
      "リファクタリング",
      "コードレビュー",
      "テスト",
    ],
  },
  {
    name: "保守・運用",
    // --primary: oklch(0.58 0.14 220) — blue
    unselected:
      "bg-primary/8 text-primary border border-primary/25 hover:bg-primary/15 hover:border-primary/40",
    selected: "bg-primary text-primary-foreground border border-primary",
    tasks: ["デバッグ", "デプロイ"],
  },
  {
    name: "その他",
    // --muted: oklch(0.94 0.015 85) — light beige
    unselected:
      "bg-muted text-muted-foreground border border-border hover:bg-accent hover:border-accent-foreground/20",
    selected: "bg-muted-foreground/70 text-white border border-transparent",
    tasks: ["ミーティング", "資料・ドキュメント作成", "学習"],
  },
] as const

export type TaskCategory = (typeof TASK_CATEGORIES)[number]
