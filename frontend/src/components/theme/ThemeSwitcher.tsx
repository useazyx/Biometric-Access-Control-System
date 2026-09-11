import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              {theme === "dark" ? <Moon className="h-5 w-5" /> : theme === "light" ? <Sun className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("light")}>Claro</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>Escuro</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>Sistema</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipContent>Alterar tema</TooltipContent>
    </Tooltip>
  )
}