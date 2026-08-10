import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getColor } from "@/lib/utils/common";

const MAX_AVATARS = 4;

type AvatarStackProps = {
  data: string[];
  totalUsers: number;
  className?: string;
};

const AvatarStack = ({ data, totalUsers, className }: AvatarStackProps) => {
  const visibleInitials = data.slice(0, MAX_AVATARS);
  const remainingCount = totalUsers - visibleInitials.length;

  if (visibleInitials.length === 0) return null;

  return (
    <AvatarGroup className={cn(className)}>
      {visibleInitials.map((initials, index) => {
        const color = getColor(initials);

        return (
          <Avatar key={`${initials}-${index}`} size="sm">
            <AvatarFallback
              className="text-[10px] font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        );
      })}
      {remainingCount > 0 && (
        <AvatarGroupCount className="text-[10px] font-medium">
          +{remainingCount}
        </AvatarGroupCount>
      )}
    </AvatarGroup>
  );
};

export default AvatarStack;
