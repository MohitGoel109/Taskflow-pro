/**
 * Seeds 10 realistic tasks + 11 dependencies. Data lives in
 * src/seedData.js (shared with the POST /seed API route, so the CLI
 * script and the in-app "Load demo data" button never drift apart).
 *
 * Run with: npm run seed   (after `docker compose up -d` + `npx prisma migrate dev`)
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const { SEED_DEFS, SEED_EDGES } = require("../src/seedData");

const prisma = new PrismaClient();

async function main() {
  await prisma.dependency.deleteMany();
  await prisma.task.deleteMany();

  const ids = {};
  for (const d of SEED_DEFS) {
    const id = randomUUID();
    ids[d.key] = id;
    await prisma.task.create({
      data: {
        id,
        title: d.title,
        description: d.description,
        column: d.column,
        status: d.status,
        startDate: d.startDate,
        durationDays: d.durationDays,
        endDate: d.startDate + d.durationDays,
      },
    });
  }

  for (const [predKey, succKey] of SEED_EDGES) {
    await prisma.dependency.create({
      data: { predecessorId: ids[predKey], successorId: ids[succKey] },
    });
  }

  console.log(`Seeded ${SEED_DEFS.length} tasks and ${SEED_EDGES.length} dependencies.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
