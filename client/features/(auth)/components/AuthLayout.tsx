import Link from "next/link";
import { ReactNode } from "react";
import { ShowcaseBoard } from "./ShowcaseBoard";

const AuthLayout = ({
  children,
  eyebrow,
  title,
  subtitle,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) => {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-background">
      {/* Left: form panel */}
      <div className="flex flex-col px-6 sm:px-12 lg:px-20 py-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-brand shadow-elegant grid place-items-center text-brand-foreground font-bold">
              T
            </div>
            <span className="font-semibold tracking-tight text-foreground">
              Taskpilot AI
            </span>
          </Link>
          <div className="text-sm text-muted-foreground">
            Need help?{" "}
            <a
              href="#"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Contact us
            </a>
          </div>
        </header>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            {eyebrow && (
              <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-brand mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {eyebrow}
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            )}
            <div className="mt-8">{children}</div>
          </div>
        </div>

        <footer className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Taskpilot AI. All rights reserved.
        </footer>
      </div>

      {/* Right: showcase panel */}
      <div className="relative hidden lg:block overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,var(--background)_120%)]" />

        <div className="relative h-full flex flex-col justify-between p-12">
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <div className="h-2 w-2 rounded-full bg-success" />
            All systems normal
          </div>

          <ShowcaseBoard />

          <blockquote className="max-w-md">
            <p className="text-lg font-medium text-foreground">
              “Taskpilot AI replaced three tools and cut our planning time in
              half. It feels like the modern JIRA we always wanted.”
            </p>
            <footer className="mt-3 text-sm text-muted-foreground">
              — Priya S., Head of Engineering at Northwind
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
