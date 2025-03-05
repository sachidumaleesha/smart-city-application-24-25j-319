import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  )
}