import { prisma } from "../src/lib/prisma.js";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      passwordHash: "demo-placeholder", // замените через регистрацию
    },
  });

  const shop = await prisma.shop.upsert({
    where: { id: "demo-shop" },
    update: {},
    create: {
      id: "demo-shop",
      name: "Демо-магазин",
      userId: user.id,
    },
  });

  console.log("✅ Database seeded");
  console.log(`   user: ${user.email}`);
  console.log(`   shop: ${shop.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
