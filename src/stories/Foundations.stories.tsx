import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Foundations/Colors & Typography",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Swatch({ name, className, hex }: { name: string; className: string; hex: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className={`h-16 ${className}`} />
      <div className="space-y-0.5 px-3 py-2">
        <p className="text-sm font-semibold">{name}</p>
        <p className="font-mono text-xs text-muted-foreground">{hex}</p>
      </div>
    </div>
  );
}

export const ColorPalette: Story = {
  render: () => (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <div>
        <h2 className="mb-1 text-lg font-semibold">브랜드 (Rose Quartz × Serenity)</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          2016년 팬톤 올해의 색 두 가지 — 헤더 그라데이션과 본문/푸터 5단계 톤
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          <Swatch name="Rose Quartz" hex="#F7CAC9" className="bg-[color:var(--rose-quartz)]" />
          <Swatch name="Serenity" hex="#92A8D1" className="bg-[color:var(--serenity)]" />
          <Swatch name="Serenity 50" hex="#F4F7FC" className="bg-[color:var(--serenity-50)]" />
          <Swatch name="Serenity 200" hex="#D7E1F0" className="bg-[color:var(--serenity-200)]" />
          <Swatch name="Serenity 600" hex="#4C6A9C" className="bg-[color:var(--serenity-600)]" />
          <Swatch name="Serenity 900" hex="#1B2A42" className="bg-[color:var(--serenity-900)]" />
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-lg font-semibold">시맨틱</h2>
        <p className="mb-4 text-sm text-muted-foreground">Emerald(2013)/Chili Pepper(2007) — 성공·오류 전용</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Swatch name="Success" hex="#009473" className="bg-success" />
          <Swatch name="Success soft" hex="#E3F5EF" className="bg-[color:var(--success-soft)]" />
          <Swatch name="Destructive" hex="#9B1B30" className="bg-destructive" />
          <Swatch name="Destructive soft" hex="#F7E6E9" className="bg-[color:var(--destructive-soft)]" />
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-lg font-semibold">헤더 그라데이션</h2>
        <div
          className="flex h-24 items-center justify-center rounded-lg text-lg font-bold"
          style={{
            background:
              "linear-gradient(115deg, var(--rose-quartz) 0%, var(--serenity) 100%)",
            color: "var(--serenity-900)",
          }}
        >
          gyujin&apos;s log
        </div>
      </div>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <p className="mb-1 font-mono text-xs uppercase tracking-wide text-primary">
          Pretendard 700 · Bold
        </p>
        <p className="text-3xl font-bold">gyujin&apos;s log</p>
      </div>
      <div>
        <p className="mb-1 font-mono text-xs uppercase tracking-wide text-primary">
          Pretendard 600 · SemiBold
        </p>
        <p className="text-xl font-semibold">Redis 캐시 무효화, 어디서부터 잘못됐나</p>
      </div>
      <div>
        <p className="mb-1 font-mono text-xs uppercase tracking-wide text-primary">
          Pretendard 400 · Regular
        </p>
        <p className="leading-relaxed">
          오늘은 지난 주에 겪었던 Redis 캐시 무효화 문제를 정리해보려 합니다. 처음엔 단순한
          캐시 미스라고 생각했지만, 실제로는 동시에 들어온 두 요청이 서로 다른 시점의 값을
          써버리는 동시성 문제였습니다.
        </p>
      </div>
      <div>
        <p className="mb-1 font-mono text-xs uppercase tracking-wide text-primary">
          JetBrains Mono 400
        </p>
        <pre className="overflow-x-auto rounded-lg bg-[color:var(--serenity-900)] p-4 font-mono text-sm text-[#e8edf6]">
          {`:root {\n  --serenity-600: #4C6A9C;\n  --serenity-900: #1B2A42;\n}`}
        </pre>
      </div>
    </div>
  ),
};
