// components/TaskChipSelector.tsx
// タスク選択チップUIコンポーネント

"use client"

const TASK_CATEGORIES = [
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

interface TaskChipSelectorProps {
  /** 現在選択されているタスク名のSet */
  selectedTaskNames: Set<string>
  /** チップのトグル時のコールバック */
  onToggle: (taskName: string) => void
}

/**
 * カテゴリ別タスク選択チップコンポーネント
 * 選択するとタスクリストに追加、再度タップで解除
 */
export function TaskChipSelector({ selectedTaskNames, onToggle }: TaskChipSelectorProps) {
  return (
    <div className="space-y-2.5">
      {TASK_CATEGORIES.map((category) => (
        <div key={category.name}>
          <p className="text-xs text-muted-foreground mb-1.5">{category.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {category.tasks.map((taskName) => {
              const isSelected = selectedTaskNames.has(taskName)
              return (
                <button
                  key={taskName}
                  type="button"
                  onClick={() => onToggle(taskName)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${isSelected ? category.selected : category.unselected}`}
                >
                  <span>{isSelected ? "✓" : "＋"}</span>
                  {taskName}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
