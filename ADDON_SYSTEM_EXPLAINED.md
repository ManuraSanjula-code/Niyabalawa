# Understanding the Add-Ons System

## Why Are Proteins (Chicken, Fish, Pork) in the Add-Ons Section?

### System Design: Set Menu + Add-Ons

Your restaurant uses a **Set Menu system** where:

1. **Main Set Menu** (Left section):
   - Customer orders a main curry with rice
   - Example: "Chicken Curry with Yellow Rice" (Half: Rs. 580 + 80 = Rs. 660)

2. **Add-Ons/Extras** (Middle sections):
   - Extra proteins to add MORE food to the meal
   - Example: Customer wants chicken curry set + extra fish roast
   - **Use case:** "I want chicken curry set, but also add extra prawns"

### Example Order Flow:

**Scenario:** Customer orders set menu but wants extra proteins

**Order:**
- Main: Chicken Curry (Half) - Rs. 580
- Rice: Yellow Rice - Rs. 80
- **Add-on:** Extra Prawns - Rs. 180
- **Add-on:** Papadum - Rs. 20
- **Total:** Rs. 860

The add-ons section allows customers to:
- ✅ Add extra proteins (chicken roast, fish, prawns)
- ✅ Add sides (papadum, sambol)
- ✅ Add desserts (wattalappam, curd)
- ✅ Add beverages (coconut water, juices)

## Current Database Structure

```
category: 'main' = Main dish in set menu (Rs. 400-800)
category: 'rice' = Rice options (Rs. 60-90)
category: 'addon' = Everything else (Rs. 20-200)
```

All extras are stored as `'addon'`:
- Extra proteins (smaller portions than main)
- Sides (papadum, sambol)
- Desserts (wattalappam, ice cream)
- Drinks (juices, beverages)

## UI Tabs Explained

### Tab 1: "EXTRA ITEMS" (Orange)
Shows all addon items - perfect for quick browsing

### Tab 2: "ALL EXTRAS" (Purple)
Shows the same items - alternative view (both tabs show identical content)

**Why two tabs?**
Originally designed for:
- Tab 1: Sides and proteins
- Tab 2: Only desserts and drinks

But since the database doesn't distinguish between addon types, both show all extras.

## Correct Usage

### For Main Set Menu:
Use the **LEFT section** (Set Menu) to select:
- Main curry
- Rice type

### For Extra Items:
Use **MIDDLE sections** (Extra Items / All Extras) to add:
- Extra proteins (if customer wants more food)
- Sides (papadum, sambol)
- Desserts (wattalappam, curd)
- Drinks (juice, coconut water)

## Prices Explained

### Main Dishes (Set Menu):
- **Half:** Rs. 400-580 (smaller portion + rice)
- **Full:** Rs. 600-900 (larger portion + rice)

### Add-Ons (Extras):
- **Single price:** Rs. 20-180 (extra portion to add to existing order)

**Example:**
- Main: Chicken Curry **Half** = Rs. 580 (includes rice)
- Addon: Chicken Roast = Rs. 150 (extra portion)
- This gives customer: Full chicken set + extra roasted chicken

## How to Add Desserts & Drinks

Currently, desserts and drinks need to be added as "addon" category products:

1. Click "Add Product"
2. Select "Addons", "Desserts", or "Drinks" tab
3. Fill details:
   - Name: "Woodapple Juice"
   - Half Price: 100 (same as full price for drinks)
   - Full Price: 100
   - Category: **Addon/Side**
   - Kitchen: Front
4. Save

The item will appear in both Extra Items tabs.

## Future Enhancement: Separate Categories

To show proteins, desserts, and drinks in separate tabs, you would need to:

1. **Update Database Schema:**
   ```sql
   ALTER TABLE menu_items 
   MODIFY category VARCHAR(20) 
   CHECK (category IN ('main', 'rice', 'addon', 'dessert', 'drink'));
   ```

2. **Update TypeScript Types:**
   ```typescript
   category: 'main' | 'rice' | 'addon' | 'dessert' | 'drink';
   ```

3. **Update Frontend Filtering:**
   ```typescript
   const addonsItems = allMenuItems.filter(item => item.category === 'addon');
   const desserts = allMenuItems.filter(item => item.category === 'dessert');
   const drinks = allMenuItems.filter(item => item.category === 'drink');
   ```

4. **Create Separate Tabs** for each category

## Summary

✅ **Current System is Correct!**
- Main dishes in "Set Menu" section
- All extras (proteins, sides, desserts, drinks) in "Extras" section
- Two tabs showing same content (for convenience)

✅ **Use Cases:**
- Customer orders set menu from LEFT
- Customer adds extras from MIDDLE
- Order total calculated on RIGHT

---

**This is a standard restaurant ordering system!** Similar to:
- Ordering a combo meal + adding extra fries
- Ordering a pizza + adding extra toppings
- Ordering rice plate + adding extra curry

The "addon" proteins are **smaller portions** meant to supplement the main dish, not replace it.
