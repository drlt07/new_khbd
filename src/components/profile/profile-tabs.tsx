"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type TabDef = { value: string; label: string; count?: number; content: React.ReactNode };

/** Tab đồng bộ với ?tab= để có thể chia sẻ link hoặc tải lại trang mà không mất vị trí. */
export function ProfileTabs({ tabs, initial }: { tabs: TabDef[]; initial: string }) {
  const [value, setValue] = useState(tabs.some((t) => t.value === initial) ? initial : tabs[0].value);
  function change(v: string) {
    setValue(v);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", v);
    window.history.replaceState(null, "", url);
  }
  return (
    <Tabs value={value} onValueChange={change}>
      <TabsList aria-label="Các phần của hồ sơ">
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
            {t.count !== undefined && <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{t.count}</span>}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => <TabsContent key={t.value} value={t.value}>{t.content}</TabsContent>)}
    </Tabs>
  );
}
