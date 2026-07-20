import 'dotenv/config'
import { prisma } from './src/lib/prisma'

const restaurantItems = [
  // Breakfast
  { name: "Tea & Bread", price: 2000, category: "Breakfast", stock: 100 },
  { name: "Tea & Bread + Egg", price: 3000, category: "Breakfast", stock: 100 },
  { name: "Tea & Bread + Beef", price: 3000, category: "Breakfast", stock: 100 },
  { name: "Tea & Bread + Turkey", price: 8000, category: "Breakfast", stock: 100 },
  { name: "Tea & Bread + Chicken", price: 7000, category: "Breakfast", stock: 100 },
  { name: "Bread & Egg", price: 2500, category: "Breakfast", stock: 100 },
  { name: "Noodles & Egg", price: 4000, category: "Breakfast", stock: 100 },
  { name: "Pap and akara", price: 2500, category: "Breakfast", stock: 100 },
  { name: "Pap and moi moi", price: 3000, category: "Breakfast", stock: 100 },
  { name: "Custard and Akara", price: 3000, category: "Breakfast", stock: 100 },
  { name: "Custard and moi moi", price: 3500, category: "Breakfast", stock: 100 },

  // Rice Dishes
  { name: "Jollof Rice", price: 1500, category: "Rice Dishes", stock: 50 },
  { name: "Fried Rice", price: 1750, category: "Rice Dishes", stock: 50 },
  { name: "White Rice", price: 1000, category: "Rice Dishes", stock: 50 },
  { name: "Village Rice", price: 3000, category: "Rice Dishes", stock: 50 },
  { name: "Asun Rice", price: 3500, category: "Rice Dishes", stock: 50 },
  { name: "Ofada Rice & Stew", price: 0, category: "Rice Dishes", stock: 50 }, // Price on request

  // Swallow
  { name: "Eba", price: 700, category: "Swallow", stock: 100 },
  { name: "Amala", price: 1500, category: "Swallow", stock: 100 },
  { name: "Poundo Yam", price: 1000, category: "Swallow", stock: 100 },
  { name: "Semo", price: 1000, category: "Swallow", stock: 100 },

  // Soups
  { name: "Okro Soup", price: 1500, category: "Soups", stock: 50 },
  { name: "Egusi Soup", price: 1500, category: "Soups", stock: 50 },
  { name: "Oha Soup", price: 2500, category: "Soups", stock: 50 },
  { name: "Vegetable Soup", price: 1500, category: "Soups", stock: 50 },

  // Sides
  { name: "Plantain", price: 1000, category: "Sides", stock: 100 },
  { name: "Plantain & Salad", price: 2000, category: "Sides", stock: 100 },
  { name: "Moi moi", price: 2000, category: "Sides", stock: 100 },
  { name: "Salad", price: 1000, category: "Sides", stock: 100 },
  { name: "Akara", price: 1500, category: "Sides", stock: 100 },

  // Proteins
  { name: "Turkey", price: 6000, category: "Proteins", stock: 50 },
  { name: "Croaker Fish", price: 5000, category: "Proteins", stock: 50 },
  { name: "Chicken", price: 4000, category: "Proteins", stock: 50 },
  { name: "Kote Fish", price: 4500, category: "Proteins", stock: 50 },
  { name: "Beef", price: 1000, category: "Proteins", stock: 50 },
  { name: "Ponmo", price: 1000, category: "Proteins", stock: 50 },
  { name: "Egg", price: 1000, category: "Proteins", stock: 100 },

  // Pepper Soup
  { name: "Turkey Pepper Soup", price: 8000, category: "Pepper Soup", stock: 20 },
  { name: "Chicken Pepper Soup", price: 7000, category: "Pepper Soup", stock: 20 },
  { name: "Catfish Pepper Soup", price: 11000, category: "Pepper Soup", stock: 20 },
  { name: "Goat Meat Pepper Soup", price: 7000, category: "Pepper Soup", stock: 20 },

  // Spaghetti
  { name: "Spaghetti with Turkey", price: 8000, category: "Spaghetti", stock: 30 },
  { name: "Spaghetti with Chicken", price: 7000, category: "Spaghetti", stock: 30 },
  { name: "Spaghetti with Beef", price: 4000, category: "Spaghetti", stock: 30 },
  { name: "Spaghetti with Egg", price: 3000, category: "Spaghetti", stock: 30 },
  { name: "Spaghetti with Fish", price: 3500, category: "Spaghetti", stock: 30 },

  // Local Specials
  { name: "Gbegiri & Yam with Egg", price: 5000, category: "Local Specials", stock: 20 },
  { name: "Gbegiri & Bread with Fish", price: 4000, category: "Local Specials", stock: 20 },
  { name: "Gbegiri & Plantain with Egg", price: 4000, category: "Local Specials", stock: 20 },

  // Rice Combos
  { name: "Jollof Rice & Turkey", price: 9000, category: "Rice Combos", stock: 30 },
  { name: "Jollof Rice & Beef", price: 6000, category: "Rice Combos", stock: 30 },
  { name: "Jollof Rice & Croaker Fish", price: 8000, category: "Rice Combos", stock: 30 },
  { name: "Jollof Rice & Kote", price: 7500, category: "Rice Combos", stock: 30 },
  { name: "Jollof Rice & Egg", price: 5000, category: "Rice Combos", stock: 30 },
  { name: "Jollof Rice & Chicken", price: 8000, category: "Rice Combos", stock: 30 },
  { name: "Jollof Rice & Goat Meat", price: 7000, category: "Rice Combos", stock: 30 },
  
  { name: "White Rice & Turkey", price: 7000, category: "Rice Combos", stock: 30 },
  { name: "White Rice & Beef", price: 5000, category: "Rice Combos", stock: 30 },
  { name: "White Rice & Croaker Fish", price: 7000, category: "Rice Combos", stock: 30 },
  { name: "White Rice & Egg", price: 4000, category: "Rice Combos", stock: 30 },
  { name: "White Rice & Chicken", price: 7000, category: "Rice Combos", stock: 30 },
  { name: "White Rice & Goat Meat", price: 6000, category: "Rice Combos", stock: 30 },
  { name: "White Rice & Kote", price: 6500, category: "Rice Combos", stock: 30 },

  { name: "Fried Rice & Turkey", price: 9500, category: "Rice Combos", stock: 30 },
  { name: "Fried Rice & Chicken", price: 8500, category: "Rice Combos", stock: 30 },
  { name: "Fried Rice & Beef", price: 6500, category: "Rice Combos", stock: 30 },
  { name: "Fried Rice & Croaker Fish", price: 8500, category: "Rice Combos", stock: 30 },
  { name: "Fried Rice & Kote", price: 8000, category: "Rice Combos", stock: 30 },
  { name: "Fried Rice & Egg", price: 5500, category: "Rice Combos", stock: 30 },
  { name: "Fried Rice & Goat Meat", price: 7500, category: "Rice Combos", stock: 30 },

  // Swallow Combos
  { name: "Eba & Turkey", price: 8200, category: "Swallow Combos", stock: 30 },
  { name: "Eba & Chicken", price: 6200, category: "Swallow Combos", stock: 30 },
  { name: "Eba & Croaker Fish", price: 7200, category: "Swallow Combos", stock: 30 },
  { name: "Eba & Kote Fish", price: 6700, category: "Swallow Combos", stock: 30 },
  { name: "Eba & Beef", price: 3200, category: "Swallow Combos", stock: 30 },
  { name: "Eba & Goat Meat", price: 5200, category: "Swallow Combos", stock: 30 },
  { name: "Eba & Egg", price: 3200, category: "Swallow Combos", stock: 30 },
  { name: "Eba & Ponmo", price: 3200, category: "Swallow Combos", stock: 30 },

  { name: "Amala & Turkey", price: 9000, category: "Swallow Combos", stock: 30 },
  { name: "Amala & Chicken", price: 7000, category: "Swallow Combos", stock: 30 },
  { name: "Amala & Croaker Fish", price: 8000, category: "Swallow Combos", stock: 30 },
  { name: "Amala & Kote Fish", price: 7500, category: "Swallow Combos", stock: 30 },
  { name: "Amala & Beef", price: 4000, category: "Swallow Combos", stock: 30 },
  { name: "Amala & Goat Meat", price: 6000, category: "Swallow Combos", stock: 30 },
  { name: "Amala & Egg", price: 4000, category: "Swallow Combos", stock: 30 },
  { name: "Amala & Ponmo", price: 4000, category: "Swallow Combos", stock: 30 },

  { name: "Poundo Yam & Turkey", price: 8500, category: "Swallow Combos", stock: 30 },
  { name: "Poundo Yam & Chicken", price: 6500, category: "Swallow Combos", stock: 30 },
  { name: "Poundo Yam & Croaker Fish", price: 7500, category: "Swallow Combos", stock: 30 },
  { name: "Poundo Yam & Kote Fish", price: 7000, category: "Swallow Combos", stock: 30 },
  { name: "Poundo Yam & Beef", price: 3500, category: "Swallow Combos", stock: 30 },
  { name: "Poundo Yam & Goat Meat", price: 5500, category: "Swallow Combos", stock: 30 },
  { name: "Poundo Yam & Egg", price: 3500, category: "Swallow Combos", stock: 30 },
  { name: "Poundo Yam & Ponmo", price: 3500, category: "Swallow Combos", stock: 30 },

  { name: "Semo & Turkey", price: 8500, category: "Swallow Combos", stock: 30 },
  { name: "Semo & Chicken", price: 6500, category: "Swallow Combos", stock: 30 },
  { name: "Semo & Croaker Fish", price: 7500, category: "Swallow Combos", stock: 30 },
  { name: "Semo & Kote Fish", price: 7000, category: "Swallow Combos", stock: 30 },
  { name: "Semo & Beef", price: 3500, category: "Swallow Combos", stock: 30 },
  { name: "Semo & Goat Meat", price: 5500, category: "Swallow Combos", stock: 30 },
  { name: "Semo & Egg", price: 3500, category: "Swallow Combos", stock: 30 },
  { name: "Semo & Ponmo", price: 3500, category: "Swallow Combos", stock: 30 },

  // Beer Sides
  { name: "Peppered meat", price: 3000, category: "Beer Sides", stock: 50 },
  { name: "Peppered Ponmo", price: 2000, category: "Beer Sides", stock: 50 },
  { name: "Peppered Fish", price: 1000, category: "Beer Sides", stock: 50 }
]

async function main() {
  console.log("Seeding Restaurant Items...")
  for (const item of restaurantItems) {
    await prisma.restaurantItem.upsert({
      where: { name: item.name },
      update: { price: item.price, category: item.category, stock: item.stock },
      create: { name: item.name, price: item.price, category: item.category, stock: item.stock },
    })
  }
  console.log(`Seeding complete! Added ${restaurantItems.length} items.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
