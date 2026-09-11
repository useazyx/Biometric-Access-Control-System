import { Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const schemes = [
  { id: "", label: "Padrão" },
  { id: "theme-violet", label: "Violeta" },
  { id: "theme-emerald", label: "Esmeralda" },
  { id: "theme-rose", label: "Rose" },
]

export default function ColorSchemePicker() {
  const applyScheme = (id: string) => {
    const root = document.documentElement
    root.classList.remove("theme-violet", "theme-emerald", "theme-rose")
    if (id) root.classList.add(id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {schemes.map(s => (
          <DropdownMenuItem key={s.id} onClick={() => applyScheme(s.id)}>
            {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}