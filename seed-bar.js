const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const barItems = [
  { name: "William Lawson", price: 25000, category: "Whiskey", stock: 20 },
  { name: "Red Label", price: 35000, category: "Whiskey", stock: 20 },
  { name: "Jack Daniel's", price: 50000, category: "Whiskey", stock: 20 },
  { name: "Martell VS", price: 80000, category: "Cognac", stock: 20 },
  { name: "Hennessy VSOP", price: 160000, category: "Cognac", stock: 10 },
  { name: "Campari", price: 40000, category: "Liqueur", stock: 20 },
  { name: "Jägermeister", price: 30000, category: "Liqueur", stock: 20 },
  { name: "Best Whiskey", price: 8000, category: "Whiskey", stock: 30 },
  { name: "Best Cream", price: 15000, category: "Liqueur", stock: 30 },
  { name: "Baileys", price: 35000, category: "Liqueur", stock: 20 },
  { name: "Four Cousins Red", price: 15000, category: "Wine", stock: 30 },
  { name: "Four Cousins Rosé", price: 15000, category: "Wine", stock: 30 },
  { name: "Four Cousins Sweet White", price: 15000, category: "Wine", stock: 30 },
  { name: "Baron Romero", price: 10000, category: "Wine", stock: 40 },
  { name: "4th Street", price: 10000, category: "Wine", stock: 40 },
  { name: "Bacardi", price: 30000, category: "Rum", stock: 20 },
  { name: "Sierra", price: 30000, category: "Tequila", stock: 20 },
  { name: "Absolut Vodka", price: 35000, category: "Vodka", stock: 20 },
  { name: "SKYY Vodka", price: 30000, category: "Vodka", stock: 20 },
  { name: "Olmeca", price: 40400, category: "Tequila", stock: 20 },
  { name: "Fanta", price: 1000, category: "Soft Drinks", stock: 50 },
  { name: "Pepsi", price: 1000, category: "Soft Drinks", stock: 50 },
  { name: "Coca-Cola", price: 1000, category: "Soft Drinks", stock: 50 },
  { name: "Chivita active", price: 4000, category: "Juice", stock: 40 },
  { name: "Hollandia Yoghurt", price: 3500, category: "Dairy", stock: 40 },
  { name: "Desperado", price: 1500, category: "Beer", stock: 50 },
  { name: "Flying fish", price: 1500, category: "Beer", stock: 50 },
  { name: "Trophy", price: 1500, category: "Beer", stock: 50 },
  { name: "Goldberg", price: 1500, category: "Beer", stock: 50 },
  { name: "Heineken", price: 2000, category: "Beer", stock: 50 },
  { name: "Budweiser", price: 1700, category: "Beer", stock: 50 },
  { name: "Guinness small stout", price: 1500, category: "Beer", stock: 50 },
  { name: "Gulder", price: 1500, category: "Beer", stock: 50 },
  { name: "Guinness medium stout", price: 1700, category: "Beer", stock: 50 },
  { name: "Guinness big stout", price: 2000, category: "Beer", stock: 50 },
  { name: "\"33\" export", price: 1500, category: "Beer", stock: 50 },
  { name: "Smirnoff ice(Small)", price: 1500, category: "Liqueur", stock: 50 },
  { name: "Smirnoff ice (big)", price: 2000, category: "Liqueur", stock: 50 },
  { name: "Water", price: 500, category: "Water", stock: 100 },
  { name: "Aquafina Water", price: 1000, category: "Water", stock: 100 },
];

async function main() {
  console.log("Seeding Bar Items...");
  for (const item of barItems) {
    await prisma.barItem.upsert({
      where: { name: item.name },
      update: { price: item.price, category: item.category, stock: item.stock },
      create: { name: item.name, price: item.price, category: item.category, stock: item.stock },
    });
  }
  console.log("Seeding complete! Added " + barItems.length + " items.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
