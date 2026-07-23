import {
  findOrganizationByName,
  searchOrganizations,
} from "./lib/mockOrganizations";
import type { CreateProjectInputs, Organization } from "./types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const checkOrganizationName = async (name: string) => {
  await delay(400);
  return findOrganizationByName(name) ?? null;
};

export const searchOrganizationsByQuery = async (query: string) => {
  await delay(350);
  return searchOrganizations(query);
};

export const createOrganization = async (name: string) => {
  await delay(500);
  return { id: crypto.randomUUID(), name: name.trim() };
};

export const createProject = async (_data: CreateProjectInputs) => {
  await delay(500);
  return { success: true };
};

export const joinOrganization = async (_organization: Organization) => {
  await delay(500);
  return { success: true };
};
