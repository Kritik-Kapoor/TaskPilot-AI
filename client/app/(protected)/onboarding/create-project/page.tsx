"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/mock-orgs";

const CreateProjectPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("org") ?? "";
  const orgName = searchParams.get("name") ?? "your organization";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit = name.trim().length >= 2;

  return (
    <div>
      <Link
        href="/onboarding/create-org"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Create your first project
          </h1>
          <p className="mt-2 text-muted-foreground">
            Projects live inside{" "}
            <span className="font-mono text-foreground">{orgName}</span>. You
            can create as many as you need later.
          </p>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand sm:inline-flex">
          <Sparkles className="h-3.5 w-3.5" />
          Step 2 of 3
        </div>
      </div>

      <form
        className="mt-8 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();

          if (!canSubmit) {
            return;
          }

          router.push(
            `/onboarding/done?org=${encodeURIComponent(orgSlug)}&project=${encodeURIComponent(slugify(name))}`,
          );
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="project-name">Project name</Label>
          <Input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mobile App"
            className="h-12 text-base"
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-desc">
            Description{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Textarea
            id="project-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            className="min-h-24 resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button asChild variant="ghost">
            <Link href="/onboarding/done">Skip for now</Link>
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            className="bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
          >
            Create project
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;
