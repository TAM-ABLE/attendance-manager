// components/TaskChipSelector.tsx
// タスク選択チップUIコンポーネント

"use client"

const TASK_CATEGORIES = [
  {
    name: "開発",
    unselected:
      "bg-cyan-50 text-cyan-700 border border-cyan-200 hover:border-cyan-400 hover:bg-cyan-100",
    selected: "bg-cyan-600 text-white border border-cyan-700",
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
    unselected:
      "bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 hover:bg-blue-100",
    selected: "bg-blue-600 text-white border border-blue-700",
    tasks: ["デバッグ", "デプロイ"],
  },
  {
    name: "その他",
    unselected:
      "bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-400 hover:bg-slate-100",
    selected: "bg-slate-600 text-white border border-slate-700",
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
