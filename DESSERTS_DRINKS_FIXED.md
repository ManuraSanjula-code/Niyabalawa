# Quick Guide: Adding Desserts & Drinks

## ✅ Fixed: Desserts/Drinks Tab Now Working!

The "Coming Soon!" message has been replaced with a functional menu that displays all addon items.

## How the System Works

Since the database has only 3 categories (`main`, `rice`, `addon`), all extra items (sides, desserts, drinks) are stored as **"addon"** category.

### Tab Layout:
- **🍗 ADD-ONS Tab**: Shows all addon items (sides, papadum, etc.)
- **🍰 DESSERT/DRINKS Tab**: Shows the same addon items (for convenience)

Both tabs display the same items from the "addon" category.

## How to Add Desserts & Drinks

1. **Click "➕ Add Product"** button in the header

2. **Select the appropriate tab:**
   - Use **"Addons"** tab for: papadum, chutneys, sides
   - Use **"Desserts"** tab for: cakes, ice cream, wattalappam
   - Use **"Drinks"** tab for: beverages, juices, soft drinks

3. **Fill in the product details:**
   ```
   Name: Woodapple Juice
   Half Price: 80
   Full Price: 150
   Category: Addon/Side (automatically selected)
   Kitchen: Front Kitchen
   ```

4. **Click "Add Product"**

5. **The item will appear in BOTH tabs** (Addons & Desserts/Drinks)

## Example Products to Add

### Desserts:
- Wattalappam (Rs. 120 / 200)
- Curd with Kithul Treacle (Rs. 100 / 180)
- Ice Cream (Rs. 150 / 250)

### Drinks:
- King Coconut (Rs. 100 / 150)
- Woodapple Juice (Rs. 80 / 150)
- Lime Juice (Rs. 60 / 100)
- Soft Drinks (Rs. 80 / 120)

### Sides/Addons:
- Papadum (Rs. 20 / 30)
- Pol Sambol (Rs. 30 / 50)
- Mixed Salad (Rs. 80 / 120)

## User Experience

✅ Items now show up immediately after adding
✅ Both tabs are functional
✅ Clear labels showing what each tab is for
✅ Empty state guides users to add products

## Technical Note

If you want separate categories for desserts and drinks in the future, you would need to:
1. Update database schema to add 'dessert' and 'drink' categories
2. Run migration to update the menu_items table
3. Update TypeScript types
4. Update frontend to filter by new categories

For now, the current 3-category system works well!

---
**Status:** ✅ Working
**Date:** October 11, 2025
