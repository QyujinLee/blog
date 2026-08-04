import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { toast } from "sonner";
import { Button } from "./button";

// Toaster는 .storybook/preview.tsx 데코레이터에서 전역으로 한 번만 마운트됨
const meta = {
  title: "UI/Toast (sonner)",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => toast("글이 임시 저장되었습니다.")}>
        기본
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.success("글이 저장되었습니다.")}
      >
        성공
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("이미지 업로드에 실패했습니다 — 5MB 이하 jpg/png/webp/gif만 가능해요.")
        }
      >
        오류
      </Button>
    </div>
  ),
};
