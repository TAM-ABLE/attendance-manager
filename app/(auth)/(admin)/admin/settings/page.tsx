import { NotificationSettingsView } from "./components/NotificationSettingsView"
import { SettingsHelpPopover } from "./components/SettingsHelpPopover"

export default function SettingsPage() {
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">通知設定</h2>
          <p className="text-muted-foreground text-sm">Slack通知やメール通知の設定</p>
        </div>
        <SettingsHelpPopover />
      </div>
      <NotificationSettingsView />
    </div>
  )
}
