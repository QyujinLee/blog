import { Suspense } from "react";
import { SearchContent } from "./search-content";

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-muted-foreground">불러오는 중...</p>}>
      <SearchContent />
    </Suspense>
  );
}
