/**
 * Utility script: seed default issue types for every project that has none.
 *
 * Usage:
 *   npx tsx src/scripts/seedDefaultIssueTypes.ts
 */
import { prisma } from "../config/db.js";
import { seedDefaultIssueTypes } from "../services/ticketType.service.js";

async function run() {
  const projects = await prisma.project.findMany({ select: { id: true, projectName: true } });

  let seeded = 0;
  for (const project of projects) {
    const count = await prisma.issueType.count({ where: { projectId: project.id } });
    if (count > 0) {
      console.log(`[skip] ${project.projectName} — already has ${count} issue types`);
      continue;
    }
    await seedDefaultIssueTypes(prisma, project.id);
    console.log(`[seed] ${project.projectName} — seeded default issue types`);
    seeded++;
  }

  console.log(`\nDone. Seeded ${seeded} / ${projects.length} projects.`);
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
