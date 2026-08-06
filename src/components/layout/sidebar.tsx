import { ProfileCard } from "./profile-card";
import { CategoryNav } from "./category-nav";

export function Sidebar({ withProfile = true }: { withProfile?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {withProfile && <ProfileCard />}
      <CategoryNav />
    </div>
  );
}
