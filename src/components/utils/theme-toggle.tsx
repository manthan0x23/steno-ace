"use client";

import { IconBrightness, IconBrightness2 } from "@tabler/icons-react";
import { Button } from "~/components/ui/button";
import { useThemeContext } from "~/providers/theme-provider";

export function ThemeToggle() {
  const { toggleTheme } = useThemeContext();

  return (
    <Button variant="ghost" onClick={toggleTheme} className="cursor-pointer">
      <IconBrightness />
    </Button>
  );
}
