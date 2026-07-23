"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrgCard } from "@/components/common/OrgCard";
import { searchOrgs } from "@/lib/mock-orgs";

const JoinOrgPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ReturnType<typeof searchOrgs>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requested, setRequested] = useState<string | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeoutId = window.setTimeout(() => {
      setResults(searchOrgs(trimmedQuery));
      setIsSearching(false);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const handleJoin = (slug: string) => {
    setRequested(slug);

    window.setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  };

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
        Join your team&apos;s workspace
      </h1>
      <p className="mt-2 text-muted-foreground">
        Search for an organization by name. If you find yours, we&apos;ll send
        an admin your request to join.
      </p>

      <div className="relative mt-8">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 pl-10 text-base"
          placeholder="Search by organization name…"
          autoFocus
        />
        {isSearching && (
          <Loader2 className="absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="mt-6 space-y-3">
        {query.trim() && !isSearching && results.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface-elevated p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              No organizations found for &quot;{query}&quot;
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Double-check the spelling or ask a teammate for the exact name.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/onboarding/create-org">Create it instead</Link>
            </Button>
          </div>
        )}

        {!query.trim() && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Start typing to search for organizations.
          </p>
        )}

        {results.map((org) => (
          <div key={org.slug}>
            <OrgCard
              org={org}
              action={requested === org.slug ? "none" : "join"}
              onAction={() => handleJoin(org.slug)}
            />
            {requested === org.slug && (
              <p className="mt-1.5 ml-1 text-xs text-success">
                ✓ Request sent — an admin will review shortly.
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 text-sm text-muted-foreground">
        Don&apos;t see your team?{" "}
        <Link
          href="/onboarding/create-org"
          className="font-medium text-brand hover:underline"
        >
          Create a new organization
        </Link>
      </div>
    </div>
  );
};

export default JoinOrgPage;
