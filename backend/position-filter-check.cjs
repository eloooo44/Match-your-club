const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const aliases = ['GK', 'GOALKEEPER', 'TORWART', 'TORMANN'];

async function run() {
  const rows = await prisma.playerProfile.findMany({
    where: {
      OR: aliases.map((alias) => ({
        position: {
          equals: alias,
          mode: 'insensitive',
        },
      })),
    },
    select: { id: true, position: true, firstName: true, lastName: true },
  });

  console.log('count', rows.length);
  console.log(rows.slice(0, 5));
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
