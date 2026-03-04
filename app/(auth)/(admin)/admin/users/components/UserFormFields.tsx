import { Mail, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type UserFormFieldsProps = {
  lastName: string
  firstName: string
  email: string
  onLastNameChange: (value: string) => void
  onFirstNameChange: (value: string) => void
  onEmailChange: (value: string) => void
}

export function UserFormFields({
  lastName,
  firstName,
  email,
  onLastNameChange,
  onFirstNameChange,
  onEmailChange,
}: UserFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>名前</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="姓"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <Input
            type="text"
            placeholder="名"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            className="flex-1"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>メールアドレス</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>
    </>
  )
}
