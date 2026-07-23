export function ShowcaseBoard() {
  const columns = [
    {
      title: "To do",
      count: 4,
      items: [
        {
          key: "FLW-241",
          title: "Auth: SSO for enterprise",
          tag: "Frontend",
          tone: "brand",
        },
        {
          key: "FLW-238",
          title: "Migrate onboarding flow",
          tag: "Design",
          tone: "accent",
        },
      ],
    },
    {
      title: "In progress",
      count: 3,
      items: [
        {
          key: "FLW-230",
          title: "Realtime activity stream",
          tag: "Backend",
          tone: "warning",
        },
        {
          key: "FLW-229",
          title: "Board grouping options",
          tag: "Product",
          tone: "brand",
        },
      ],
    },
    {
      title: "Done",
      count: 12,
      items: [
        {
          key: "FLW-201",
          title: "Sprint planning polish",
          tag: "QA",
          tone: "success",
        },
      ],
    },
  ] as const;

  const toneClass: Record<string, string> = {
    brand: "bg-brand/15 text-brand",
    accent: "bg-accent/25 text-accent-foreground",
    warning: "bg-warning/25 text-warning-foreground",
    success: "bg-success/25 text-success-foreground",
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-surface-elevated/70 backdrop-blur-xl shadow-elegant p-4">
      <div className="flex items-center justify-between px-2 pb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Sprint 24 · Web
          </div>
          <div className="text-sm font-semibold text-foreground">
            Product board
          </div>
        </div>
        <div className="flex -space-x-2">
          {["#7c5cff", "#22c1c3", "#f97316", "#ec4899"].map((c) => (
            <div
              key={c}
              className="h-6 w-6 rounded-full ring-2 ring-surface-elevated"
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {columns.map((col) => (
          <div key={col.title} className="rounded-xl bg-background/60 p-2">
            <div className="flex items-center justify-between px-1 py-1.5">
              <span className="text-xs font-semibold text-foreground">
                {col.title}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {col.count}
              </span>
            </div>
            <div className="space-y-2">
              {col.items.map((it) => (
                <div
                  key={it.key}
                  className="rounded-lg border border-border/70 bg-card p-2.5 shadow-card"
                >
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {it.key}
                  </div>
                  <div className="text-xs font-medium text-foreground mt-0.5 leading-snug">
                    {it.title}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${toneClass[it.tone]}`}
                    >
                      {it.tag}
                    </span>
                    <div className="h-4 w-4 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
