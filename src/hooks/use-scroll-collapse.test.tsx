import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { useScrollCollapse } from "./use-scroll-collapse";

function Probe() {
  const collapsed = useScrollCollapse();
  return (
    <div style={{ height: "3000px" }} data-testid="probe">
      {collapsed ? "collapsed" : "expanded"}
    </div>
  );
}

/** y까지 스크롤한 뒤 scroll 이벤트 → setState → 렌더가 끝나길 기다리고 상태를 읽는다 */
async function stateAfterScrollTo(y: number) {
  window.scrollTo(0, y);
  await vi.waitFor(() => expect(window.scrollY).toBe(y));
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0))),
  );
  return document.querySelector("[data-testid=probe]")?.textContent;
}

// 접힘 80 / 펴짐 40으로 벌어져 있어야, 헤더가 접히며 문서가 32px 짧아져
// scrollY가 강제로 줄어도 반대 상태로 되돌아가지 않는다 (무한 떨림 방지)
test("접힘/펴짐 임계값에 히스테리시스가 있다", async () => {
  await render(<Probe />);

  expect(await stateAfterScrollTo(60)).toBe("expanded"); // 80 미만이라 아직 안 접힘
  expect(await stateAfterScrollTo(100)).toBe("collapsed");
  expect(await stateAfterScrollTo(60)).toBe("collapsed"); // 40 초과면 유지 — 여기가 핵심
  expect(await stateAfterScrollTo(30)).toBe("expanded");

  window.scrollTo(0, 0);
});
