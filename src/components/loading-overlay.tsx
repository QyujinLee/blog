function LoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "color-mix(in oklch, var(--serenity-900) 50%, transparent)" }}
      role="status"
      aria-label="로딩 중"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- SMIL 애니메이션이 실제로 재생돼야 해서 next/image 최적화 파이프라인을 거치지 않고 원본 svg를 그대로 사용 */}
      <img src="/loading-logo.svg" alt="" className="w-64" />
    </div>
  );
}

export { LoadingOverlay };
