// components/TaskChipSelector.tsx
// タスク選択チップUIコンポーネント

"use client"

import { TASK_CATEGORIES } from "@/lib/task-categories"

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
          <fieldset className="flex flex-wrap gap-1.5 border-none p-0 m-0">
            <legend className="sr-only">{category.name}のタスク</legend>
            {category.tasks.map((taskName) => {
              const isSelected = selectedTaskNames.has(taskName)
              return (
                <button
                  key={taskName}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${taskName}を${isSelected ? "解除" : "追加"}`}
                  onClick={() => onToggle(taskName)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${isSelected ? category.selected : category.unselected}`}
                >
                  <span>{isSelected ? "✓" : "＋"}</span>
                  {taskName}
                </button>
              )
            })}
          </fieldset>
        </div>
      ))}
    </div>
  )
}
