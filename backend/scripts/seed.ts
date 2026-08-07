import { prisma } from "../src/lib/prisma.js";

async function main() {
  await prisma.product.createMany({
    data: [
      {
        ozonId: "SKU-001",
        name: "Ноутбук Lenovo IdeaPad",
        description: '"15.6", Ryzen 7, 16GB RAM, SSD 512GB',
        price: 64990.00,
        image: "https://picsum.photos/300?1",
      },
      {
        ozonId: "SKU-002",
        name: "Мышь Logitech MX Master 3S",
        description: "Беспроводная мышь",
        price: 9990.00,
        image: "https://picsum.photos/300?2",
      },
      {
        ozonId: "SKU-003",
        name: "Клавиатура Keychron K8",
        description: "Механическая клавиатура",
        price: 11990.00,
        image: "https://picsum.photos/300?3",
      },
      {
        ozonId: "SKU-004",
        name: "Монитор LG UltraWide",
        description: "34 дюйма",
        price: 39990.00,
        image: "https://picsum.photos/300?4",
      },
      {
        ozonId: "SKU-005",
        name: "Наушники Sony WH-1000XM5",
        description: "Шумоподавление",
        price: 32990.00,
        image: "https://picsum.photos/300?5",
      },
    ],
  });
}

main()
  .then(async () => {
    console.log("✅ Database seeded");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });