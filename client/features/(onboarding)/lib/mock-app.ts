export type Project = {
  id: string;
  key: string;
  name: string;
  color: string;
  description: string;
  orgSlug: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Member" | "Viewer";
  avatarColor: string;
  status: "Active" | "Invited";
};

export type TicketStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done";
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";
export type TicketType = "Story" | "Bug" | "Task" | "Epic";

export type Ticket = {
  id: string;
  key: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  assigneeId: string | null;
  projectId: string;
  labels: string[];
  points?: number;
  updated: string;
};

export type JoinRequest = {
  id: string;
  name: string;
  email: string;
  orgSlug: string;
  requestedProjectId?: string;
  message?: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  avatarColor: string;
};

export const PROJECTS: Project[] = [
  {
    id: "p1",
    key: "FLOW",
    name: "Flowline Core",
    color: "#7c5cff",
    description: "Main product roadmap and shipping",
    orgSlug: "acme",
  },
  {
    id: "p2",
    key: "WEB",
    name: "Marketing Site",
    color: "#22c1c3",
    description: "flowline.dev website & docs",
    orgSlug: "acme",
  },
  {
    id: "p3",
    key: "MOB",
    name: "Mobile App",
    color: "#f97316",
    description: "iOS & Android clients",
    orgSlug: "acme",
  },
  {
    id: "p4",
    key: "OPS",
    name: "Platform Ops",
    color: "#ec4899",
    description: "Infra, CI/CD, observability",
    orgSlug: "acme",
  },
];

export const MEMBERS: Member[] = [
  {
    id: "u1",
    name: "Ava Martinez",
    email: "ava@flowline.dev",
    role: "Admin",
    avatarColor: "#7c5cff",
    status: "Active",
  },
  {
    id: "u2",
    name: "Ben Ito",
    email: "ben@flowline.dev",
    role: "Member",
    avatarColor: "#22c1c3",
    status: "Active",
  },
  {
    id: "u3",
    name: "Clara Novak",
    email: "clara@flowline.dev",
    role: "Member",
    avatarColor: "#f97316",
    status: "Active",
  },
  {
    id: "u4",
    name: "Diego Ruiz",
    email: "diego@flowline.dev",
    role: "Member",
    avatarColor: "#ec4899",
    status: "Active",
  },
  {
    id: "u5",
    name: "Eun Park",
    email: "eun@flowline.dev",
    role: "Viewer",
    avatarColor: "#635bff",
    status: "Active",
  },
  {
    id: "u6",
    name: "Farah Khan",
    email: "farah@flowline.dev",
    role: "Member",
    avatarColor: "#0ea5e9",
    status: "Invited",
  },
];

function t(
  n: number,
  key: string,
  title: string,
  status: TicketStatus,
  priority: TicketPriority,
  type: TicketType,
  projectId: string,
  assigneeId: string | null,
  labels: string[],
  points: number,
  daysAgo: number,
): Ticket {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: `t${n}`,
    key,
    title,
    status,
    priority,
    type,
    projectId,
    assigneeId,
    labels,
    points,
    updated: d.toISOString(),
  };
}

export const TICKETS: Ticket[] = [
  t(
    1,
    "FLOW-101",
    "Implement drag & drop on board columns",
    "in_progress",
    "High",
    "Story",
    "p1",
    "u1",
    ["frontend", "board"],
    5,
    1,
  ),
  t(
    2,
    "FLOW-102",
    "Ticket detail side panel",
    "todo",
    "Medium",
    "Story",
    "p1",
    "u2",
    ["frontend"],
    3,
    2,
  ),
  t(
    3,
    "FLOW-103",
    "Fix keyboard trap in filter menu",
    "backlog",
    "Low",
    "Bug",
    "p1",
    "u3",
    ["a11y"],
    2,
    3,
  ),
  t(
    4,
    "FLOW-104",
    "Sprint burndown chart",
    "in_review",
    "High",
    "Story",
    "p1",
    "u4",
    ["analytics"],
    8,
    1,
  ),
  t(
    5,
    "FLOW-105",
    "Migrate auth to new gateway",
    "done",
    "Urgent",
    "Task",
    "p1",
    "u1",
    ["backend"],
    5,
    6,
  ),
  t(
    6,
    "FLOW-106",
    "Roadmap timeline view",
    "backlog",
    "Medium",
    "Epic",
    "p1",
    null,
    ["planning"],
    13,
    5,
  ),
  t(
    7,
    "FLOW-107",
    "Comment mentions with autocomplete",
    "todo",
    "Medium",
    "Story",
    "p1",
    "u5",
    ["frontend", "comments"],
    3,
    2,
  ),
  t(
    8,
    "FLOW-108",
    "Websocket reconnect storm",
    "in_progress",
    "Urgent",
    "Bug",
    "p1",
    "u2",
    ["realtime"],
    5,
    0,
  ),
  t(
    9,
    "WEB-14",
    "Rewrite pricing hero",
    "todo",
    "Medium",
    "Task",
    "p2",
    "u3",
    ["marketing"],
    2,
    4,
  ),
  t(
    10,
    "WEB-15",
    "SEO metadata audit",
    "in_progress",
    "Low",
    "Task",
    "p2",
    "u5",
    ["seo"],
    3,
    2,
  ),
  t(
    11,
    "MOB-42",
    "Push notifications for mentions",
    "backlog",
    "High",
    "Story",
    "p3",
    "u4",
    ["mobile"],
    8,
    3,
  ),
  t(
    12,
    "OPS-9",
    "Rotate signing keys",
    "done",
    "High",
    "Task",
    "p4",
    "u1",
    ["security"],
    3,
    8,
  ),
  t(
    13,
    "OPS-9",
    "Rotate signing keys",
    "done",
    "High",
    "Task",
    "p4",
    "u1",
    ["security"],
    3,
    8,
  ),
  t(
    14,
    "OPS-9",
    "Rotate signing keys",
    "done",
    "High",
    "Task",
    "p4",
    "u1",
    ["security"],
    3,
    8,
  ),
  t(
    15,
    "OPS-9",
    "Rotate signing keys",
    "done",
    "High",
    "Task",
    "p4",
    "u1",
    ["security"],
    3,
    8,
  ),
];

export const JOIN_REQUESTS: JoinRequest[] = [
  {
    id: "r1",
    name: "Grace Liu",
    email: "grace@northwind.co",
    orgSlug: "acme",
    requestedProjectId: "p1",
    message: "Joining the platform team.",
    requestedAt: new Date(Date.now() - 3600e3).toISOString(),
    status: "pending",
    avatarColor: "#7c5cff",
  },
  {
    id: "r2",
    name: "Henry Osei",
    email: "henry@lab.io",
    orgSlug: "acme",
    requestedProjectId: "p2",
    message: "I'll be helping with marketing site copy.",
    requestedAt: new Date(Date.now() - 8 * 3600e3).toISOString(),
    status: "pending",
    avatarColor: "#22c1c3",
  },
  {
    id: "r3",
    name: "Ines Rossi",
    email: "ines@example.com",
    orgSlug: "acme",
    requestedAt: new Date(Date.now() - 26 * 3600e3).toISOString(),
    status: "pending",
    avatarColor: "#f97316",
    message: "Excited to contribute!",
  },
  {
    id: "r4",
    name: "Jamal Wright",
    email: "jamal@design.studio",
    orgSlug: "acme",
    requestedProjectId: "p3",
    requestedAt: new Date(Date.now() - 2 * 86400e3).toISOString(),
    status: "approved",
    avatarColor: "#ec4899",
  },
  {
    id: "r5",
    name: "Kira Sato",
    email: "kira@old-mail.jp",
    orgSlug: "acme",
    requestedAt: new Date(Date.now() - 5 * 86400e3).toISOString(),
    status: "rejected",
    avatarColor: "#635bff",
    message: "Was on the wrong org.",
  },
];

export const STATUS_META: Record<
  TicketStatus,
  { label: string; dot: string; ring: string }
> = {
  backlog: {
    label: "Backlog",
    dot: "bg-muted-foreground/60",
    ring: "ring-muted-foreground/30",
  },
  todo: { label: "To Do", dot: "bg-sky-500", ring: "ring-sky-500/30" },
  in_progress: {
    label: "In Progress",
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
  },
  in_review: {
    label: "In Review",
    dot: "bg-violet-500",
    ring: "ring-violet-500/30",
  },
  done: { label: "Done", dot: "bg-emerald-500", ring: "ring-emerald-500/30" },
};

export const PRIORITY_META: Record<
  TicketPriority,
  { label: string; className: string }
> = {
  Low: { label: "Low", className: "text-muted-foreground" },
  Medium: { label: "Medium", className: "text-sky-600 dark:text-sky-400" },
  High: { label: "High", className: "text-amber-600 dark:text-amber-400" },
  Urgent: { label: "Urgent", className: "text-destructive" },
};

export const TYPE_META: Record<
  TicketType,
  { label: string; className: string }
> = {
  Story: {
    label: "Story",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  Bug: {
    label: "Bug",
    className:
      "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  },
  Task: {
    label: "Task",
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  },
  Epic: {
    label: "Epic",
    className:
      "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  },
};

export function memberById(id: string | null): Member | undefined {
  if (!id) return undefined;
  return MEMBERS.find((m) => m.id === id);
}

export function projectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
