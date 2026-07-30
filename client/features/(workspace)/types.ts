export type Project = {
  id: string;
  projectName: string;
  projectKey: string;
  description: string | null;
  isJoined: boolean;
  role: string | null;
};

export type ProjectMember = {
  role: string;
  id: string;
  username: string;
};

export type ProjectLabel = {
  id: string;
  name: string;
  color: string;
};
