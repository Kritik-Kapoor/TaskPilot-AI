"use client";

import Link from "next/link";
import { Building2, UserPlus } from "lucide-react";

const ChoosePathOptions = () => {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/onboarding/create-org"
        className="flex items-start gap-3 rounded-lg border border-input bg-input/10 p-4 text-left transition-colors hover:border-ring hover:bg-input/20"
      >
        <Building2 className="mt-0.5 size-5 shrink-0 text-primary" />
        <span>
          <span className="block text-sm font-medium">
            Create a new organization
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Set up a new workspace and create your first project.
          </span>
        </span>
      </Link>
      <Link
        href="/onboarding/join-org"
        className="flex items-start gap-3 rounded-lg border border-input bg-input/10 p-4 text-left transition-colors hover:border-ring hover:bg-input/20"
      >
        <UserPlus className="mt-0.5 size-5 shrink-0 text-primary" />
        <span>
          <span className="block text-sm font-medium">
            Join an existing organization
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Search for your team&apos;s organization and request to join.
          </span>
        </span>
      </Link>
    </div>
  );
};

export default ChoosePathOptions;
