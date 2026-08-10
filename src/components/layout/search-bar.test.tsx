import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SearchBar } from "./search-bar";

test("입력 후 검색 버튼을 누르면 트림된 검색어로 onSearch가 호출된다", async () => {
  const onSearch = vi.fn();
  const screen = await render(<SearchBar onSearch={onSearch} />);

  await screen.getByLabelText("검색어", { exact: true }).fill("  jwt  ");
  await screen.getByLabelText("검색", { exact: true }).click();

  expect(onSearch).toHaveBeenCalledWith("jwt");
});

test("검색어가 없으면 지우기 버튼이 비활성화된다", async () => {
  const screen = await render(<SearchBar onSearch={vi.fn()} />);

  await expect.element(screen.getByLabelText("검색어 지우기")).toBeDisabled();

  await screen.getByLabelText("검색어", { exact: true }).fill("next.js");

  await expect.element(screen.getByLabelText("검색어 지우기")).toBeEnabled();
});
