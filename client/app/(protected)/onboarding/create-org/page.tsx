"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrgCard } from "@/components/common/OrgCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { findOrgByName, slugify } from "@/lib/mock-orgs";

type Status = "idle" | "checking" | "available" | "taken";

const CreateOrgPage = () => {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [takenOrg, setTakenOrg] = useState<ReturnType<typeof findOrgByName>>();

  const router = useRouter();
  const slug = useMemo(() => slugify(name), [name]);

  const check = (val: string) => {
    setName(val);

    if (!val.trim()) {
      setStatus("idle");
      setTakenOrg(undefined);
      return;
    }

    setStatus("checking");
    setTakenOrg(undefined);

    window.setTimeout(() => {
      const hit = findOrgByName(val);

      if (hit) {
        setStatus("taken");
        setTakenOrg(hit);
      } else {
        setStatus("available");
      }
    }, 500);
  };

  const canSubmit = status === "available" && name.trim().length >= 2;

  return (
    <div>
      <Link
        href="/onboarding"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight">
        Name your organization
      </h1>
      <p className="mt-2 text-muted-foreground">
        This is how your team will find and identify your workspace on Flowline.
      </p>

      <form
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();

          if (canSubmit) {
            router.push(
              `/onboarding/create-project?org=${encodeURIComponent(slug)}&name=${encodeURIComponent(name.trim())}`,
            );
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization name</Label>
          <div className="relative">
            <Input
              id="org-name"
              className="h-12 pr-10 text-base"
              placeholder="e.g. Taskpilot AI"
              value={name}
              onChange={(e) => check(e.target.value)}
              autoFocus
            />
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              {status === "checking" && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {status === "available" && (
                <div className="grid h-6 w-6 place-items-center rounded-full bg-success/15">
                  <Check className="h-3.5 w-3.5 text-success" />
                </div>
              )}
              {status === "taken" && (
                <div className="grid h-6 w-6 place-items-center rounded-full bg-destructive/15">
                  <X className="h-3.5 w-3.5 text-destructive" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              URL:{" "}
              <span className="font-mono text-foreground">
                taskpilot.app/{slug || "your-org"}
              </span>
            </span>
            {status === "available" && (
              <span className="font-medium text-success">
                Name is available
              </span>
            )}
            {status === "taken" && (
              <span className="font-medium text-destructive">
                Already taken
              </span>
            )}
          </div>
        </div>

        {status === "taken" && takenOrg && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="mb-3 text-sm font-medium text-foreground">
              An organization with this name already exists:
            </div>
            <OrgCard org={takenOrg} action="taken" />
            <div className="mt-3 text-xs text-muted-foreground">
              Is this your team?{" "}
              <Link
                href={`/onboarding/join-org?q=${encodeURIComponent(takenOrg.name)}`}
                className="font-medium text-brand hover:underline"
              >
                Request to join instead
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button asChild variant="ghost">
            <Link href="/onboarding">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            className="bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrgPage;
