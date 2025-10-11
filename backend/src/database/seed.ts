import { pool } from './postgres';

const seedMenuItems = async () => {
  try {
    console.log('🌱 Seeding menu items...');

    const menuItems = [
      // Main Dishes
      { id: '1', name: 'Chicken', halfPrice: 580, fullPrice: 800, category: 'main', kitchen: 'back' },
      { id: '2', name: 'Roast Chicken', halfPrice: 700, fullPrice: 900, category: 'main', kitchen: 'back' },
      { id: '3', name: 'Fish (Thalapath)', halfPrice: 650, fullPrice: 800, category: 'main', kitchen: 'back' },
      { id: '4', name: 'Fish (Abulthiyal)', halfPrice: 600, fullPrice: 850, category: 'main', kitchen: 'back' },
      { id: '5', name: 'Fish Stew', halfPrice: 650, fullPrice: 850, category: 'main', kitchen: 'back' },
      { id: '6', name: 'Fried Fish', halfPrice: 700, fullPrice: 800, category: 'main', kitchen: 'front' },
      { id: '7', name: 'Pork', halfPrice: 700, fullPrice: 850, category: 'main', kitchen: 'back' },
      { id: '8', name: 'Pork Stew', halfPrice: 750, fullPrice: 950, category: 'main', kitchen: 'back' },
      { id: '9', name: 'Prawns', halfPrice: 750, fullPrice: 900, category: 'main', kitchen: 'back' },
      { id: '10', name: 'Cuttlefish', halfPrice: 700, fullPrice: 900, category: 'main', kitchen: 'back' },
      { id: '11', name: 'Egg', halfPrice: 480, fullPrice: 650, category: 'main', kitchen: 'front' },
      { id: '12', name: 'Vegetable', halfPrice: 400, fullPrice: 600, category: 'main', kitchen: 'front' },
      
      // Rice Types
      { id: 'r1', name: 'Yellow Rice', halfPrice: 80, fullPrice: 80, category: 'rice', kitchen: 'back' },
      { id: 'r2', name: 'Red Rice', halfPrice: 70, fullPrice: 70, category: 'rice', kitchen: 'back' },
      { id: 'r3', name: 'White Rice', halfPrice: 60, fullPrice: 60, category: 'rice', kitchen: 'back' },
      { id: 'r4', name: 'Basmati Rice', halfPrice: 90, fullPrice: 90, category: 'rice', kitchen: 'back' },
      
      // Add-ons
      { id: 'a1', name: 'Chicken Roast', halfPrice: 150, fullPrice: 150, category: 'addon', kitchen: 'back' },
      { id: 'a2', name: 'Fish (Thalapath)', halfPrice: 120, fullPrice: 120, category: 'addon', kitchen: 'back' },
      { id: 'a3', name: 'Fish (Abulthiyal)', halfPrice: 130, fullPrice: 130, category: 'addon', kitchen: 'back' },
      { id: 'a4', name: 'Fish Stew', halfPrice: 120, fullPrice: 120, category: 'addon', kitchen: 'back' },
      { id: 'a5', name: 'Fish Fried', halfPrice: 140, fullPrice: 140, category: 'addon', kitchen: 'front' },
      { id: 'a6', name: 'Pork', halfPrice: 160, fullPrice: 160, category: 'addon', kitchen: 'back' },
      { id: 'a7', name: 'Pork Stew', halfPrice: 170, fullPrice: 170, category: 'addon', kitchen: 'back' },
      { id: 'a8', name: 'Prawns', halfPrice: 180, fullPrice: 180, category: 'addon', kitchen: 'back' },
      { id: 'a9', name: 'Cuttlefish', halfPrice: 150, fullPrice: 150, category: 'addon', kitchen: 'back' },
      { id: 'a10', name: 'Egg', halfPrice: 80, fullPrice: 80, category: 'addon', kitchen: 'front' },
      { id: 'a11', name: 'Omlet', halfPrice: 90, fullPrice: 90, category: 'addon', kitchen: 'front' },
      { id: 'a12', name: 'Poshan - Vegetable', halfPrice: 100, fullPrice: 100, category: 'addon', kitchen: 'front' },
    ];

    // Clear existing menu items
    await pool.query('DELETE FROM menu_items');

    // Insert menu items
    for (const item of menuItems) {
      await pool.query(
        `INSERT INTO menu_items (id, name, half_price, full_price, category, kitchen)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE
         SET name = $2, half_price = $3, full_price = $4, category = $5, kitchen = $6`,
        [item.id, item.name, item.halfPrice, item.fullPrice, item.category, item.kitchen]
      );
    }

    console.log(`✅ Seeded ${menuItems.length} menu items`);
  } catch (error) {
    console.error('❌ Error seeding menu items:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    await seedMenuItems();
    console.log('✅ Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedMenuItems };
