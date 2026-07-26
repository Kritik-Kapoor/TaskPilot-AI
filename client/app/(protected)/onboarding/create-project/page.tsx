"use client";

import Link from "next/link";
import { ArrowLeft, Info, Sparkles } from "lucide-react";
import useCreateProjectPage from "@/features/(onboarding)/hooks/useCreateProjectPage";
import CreateProjectForm from "@/features/(onboarding)/components/CreateProjectForm";

const CreateProjectPage = () => {
  const {
    state: { orgName, form, isSubmitting },
  } = useCreateProjectPage();

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
          <p className="mt-2 text-sm text-muted-foreground">
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

      <div className="mt-6 flex gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p>
          Your organization becomes discoverable for others to join only after
          you create at least one project. Until then, it won&apos;t appear in
          organization search.
        </p>
      </div>

      <CreateProjectForm form={form} isSubmitting={isSubmitting} />
    </div>
  );
};

export default CreateProjectPage;
