import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { CodeBlockCopyButton } from "./code-block-copy-button";

test("복사 버튼을 누르면 코드 텍스트가 클립보드로 복사되고 아이콘 상태가 바뀐다", async () => {
  const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

  const screen = await render(
    <CodeBlockCopyButton>{"const x = 1;"}</CodeBlockCopyButton>,
  );

  await screen.getByLabelText("코드 복사").click();

  expect(writeText).toHaveBeenCalledWith("const x = 1;");
  await expect.element(screen.getByLabelText("복사됨")).toBeVisible();

  writeText.mockRestore();
});
