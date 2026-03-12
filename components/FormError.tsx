interface FormErrorProps {
  message: string
}

export function FormError({ message }: FormErrorProps) {
  return <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">{message}</div>
}
