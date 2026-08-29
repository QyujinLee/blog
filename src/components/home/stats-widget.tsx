"use client";

import Link from "next/link";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Line, LineChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { usePopularPosts, useVisits } from "@/hooks/use-stats";

const chartConfig = {
  count: { label: "조회수", color: "var(--primary)" },
} satisfies ChartConfig;

// 백엔드가 UTC 자정 ISO datetime("2026-08-23T00:00:00.000Z")으로 내려줌 —
// getMonth()/getDate()(로컬 시간)로 읽으면 음수 UTC 오프셋 지역에서 하루 밀리므로
// 항상 UTC 기준으로 읽어야 백엔드가 의도한 날짜와 일치함
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

function StatsWidgetContent() {
  const { data: popularPosts } = usePopularPosts(5);
  const { data: visits } = useVisits(30);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>인기글 TOP5</CardTitle>
        </CardHeader>
        <CardContent>
          {popularPosts && popularPosts.length > 0 ? (
            <ol className="flex flex-col gap-2">
              {popularPosts.map((post, index) => (
                <li key={post.slug} className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-muted-foreground">
                    {index + 1}
                  </span>
                  <Link
                    href={`/posts/${post.slug}`}
                    className="flex-1 truncate hover:underline"
                  >
                    {post.title}
                  </Link>
                  <span className="font-mono text-xs text-muted-foreground">
                    {post.viewCount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">
              아직 조회된 글이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 30일 조회 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-40 w-full">
            <LineChart data={visits} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) =>
                      typeof label === "string" ? formatDate(label) : label
                    }
                  />
                }
              />
              <Line
                dataKey="count"
                type="monotone"
                stroke="var(--color-count)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsWidgetFallback({
  resetErrorBoundary,
}: {
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      <p>통계를 불러오지 못했습니다.</p>
      <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
        다시 시도
      </Button>
    </div>
  );
}

// 위젯 하나가 실패해도 글 본문/레이아웃까지 무너지지 않도록 위젯 단위로 에러 바운더리를 둠
// (TanStack Query 공식 문서가 제시하는 QueryErrorResetBoundary + react-error-boundary 조합)
export function StatsWidget() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} fallbackRender={StatsWidgetFallback}>
          <StatsWidgetContent />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
