import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DetailItem {
  label: string
  value: string | React.ReactNode
}

interface DialogDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  details: DetailItem[]
}

export function DialogDetails({ open, onOpenChange, title, description, details }: DialogDetailsProps) {
  const normalizeValue = (value: string | React.ReactNode): React.ReactNode => {
    if (typeof value === "string") {
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : "N/A"
    }
    if (value === null || value === undefined) {
      return "N/A"
    }
    return value
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="mt-4 divide-y">
          {details.map((detail, index) => (
            <div key={index} className="py-3 flex items-start gap-3">
              <span className="min-w-[180px] text-sm font-medium text-muted-foreground">{detail.label}</span>
              <span className="text-sm break-words">{normalizeValue(detail.value)}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
