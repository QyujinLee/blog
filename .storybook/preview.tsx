import type { Decorator, Preview } from "@storybook/nextjs-vite";
import React from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "../src/components/ui/tooltip";
import { Toaster } from "../src/components/ui/sonner";
import "../src/app/globals.css";
import "./fonts.css";

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? "light";
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme={theme}
      enableSystem={false}
    >
      <TooltipProvider>
        <div
          className="font-sans bg-background text-foreground p-6"
          style={{ minHeight: "100vh" }}
        >
          <Story />
        </div>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
  globalTypes: {
    theme: {
      description: "라이트/다크 테마",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [withTheme],
};

export default preview;
