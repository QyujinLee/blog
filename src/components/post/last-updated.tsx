const formatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function LastUpdated({
  createdAt,
  updatedAt,
}: {
  createdAt: string;
  updatedAt: string;
}) {
  const wasUpdated = updatedAt !== createdAt;

  return (
    <p className="font-mono text-xs text-muted-foreground">
      {formatter.format(new Date(createdAt))} 작성
      {wasUpdated && ` · ${formatter.format(new Date(updatedAt))} 수정`}
    </p>
  );
}
