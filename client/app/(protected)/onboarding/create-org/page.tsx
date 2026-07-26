"use client";

import { ArrowLeft } from "lucide-react";
import useCreateOrgPage from "@/features/(onboarding)/hooks/useCreateOrgPage";
import Link from "next/link";
import CreateOrgForm from "@/features/(onboarding)/components/CreateOrgForm";

const CreateOrgPage = () => {
  const {
    state: {
      form,
      slug,
      status,
      takenOrg,
      canSubmit,
      isSubmitting,
      isInitializing,
      isEditingExistingOrg,
    },
    actions: { submit },
  } = useCreateOrgPage();

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
        {isEditingExistingOrg
          ? "Update your organization"
          : "Name your organization"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {isEditingExistingOrg
          ? "Review or update your organization details before continuing."
          : "This is how your team will find and identify your workspace on Flowline."}
      </p>

      <CreateOrgForm
        form={form}
        isSubmitting={isSubmitting}
        isInitializing={isInitializing}
        isEditingExistingOrg={isEditingExistingOrg}
        submit={submit}
        status={status}
        takenOrg={takenOrg}
        canSubmit={canSubmit}
        slug={slug}
      />
    </div>
  );
};

export default CreateOrgPage;
