# Admin Panel Feature - Add Products

## Overview
Added a comprehensive Admin Panel that allows adding new products to the menu including SET MENU items, addons, desserts, and drinks.

## Features Added

### 1. **Frontend Components**

#### `src/components/AdminPanel.tsx`
- Beautiful modal-based admin interface
- Tabbed interface for different product categories:
  - 🍽️ **Set Menu** - Main dishes and rice options
  - ➕ **Addons** - Side dishes and add-ons
  - 🍨 **Desserts** - Dessert items
  - 🍷 **Drinks** - Beverage items

**Form Fields:**
- Product Name (required)
- Half Price (required, must be positive)
- Full Price (required, must be >= half price)
- Category (main/rice for set menu, addon for others)
- Kitchen Station (front/back kitchen)

**Features:**
- Real-time validation
- Success/Error messages
- Auto-refresh menu after adding product
- Clean form reset after successful submission
- Loading states during submission

### 2. **Backend API Routes**

#### `backend/src/routes/menu.ts`
Added three new endpoints:

**POST /api/menu**
- Create a new menu item
- Auto-generates unique ID with format:
  - `M` prefix for main dishes
  - `R` prefix for rice
  - `A` prefix for addons
- Example ID: `M72704501`, `R72704502`, `A72704503`

**PUT /api/menu/:id**
- Update existing menu item
- Supports partial updates

**DELETE /api/menu/:id**
- Delete a menu item
- Returns confirmation message

### 3. **Frontend API Integration**

#### `src/services/api.ts`
Added menu management functions:
- `createMenuItem(item)` - Create new menu item
- `updateMenuItem(id, item)` - Update existing item
- `deleteMenuItem(id)` - Delete item

### 4. **Main App Integration**

#### `src/App.tsx`
- Added "➕ Add Product" button in header (purple button)
- Opens admin panel modal when clicked
- Auto-refreshes menu items after product is added
- Moved "Pending Orders" button styling to orange

## How to Use

1. **Start the backend server** (if not running):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend** (if not running):
   ```bash
   npm run dev
   ```

3. **Access Admin Panel:**
   - Click the "➕ Add Product" button in the top right of the header
   - Select the appropriate tab (Set Menu, Addons, Desserts, or Drinks)

4. **Add a Product:**
   - Enter product name
   - Enter half price (e.g., 250.00)
   - Enter full price (e.g., 450.00)
   - Select category:
     - For Set Menu: Choose "Main Dish" or "Rice"
     - For Addons/Desserts/Drinks: "Addon/Side" is selected
   - Select kitchen station (Front or Back kitchen)
   - Click "Add Product"

5. **Success:**
   - You'll see a success message
   - The form will reset
   - Menu items will automatically refresh
   - New item will appear in the appropriate section

## Database Schema

The `menu_items` table structure:
```sql
CREATE TABLE menu_items (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  half_price DECIMAL(10,2) NOT NULL,
  full_price DECIMAL(10,2) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('main', 'rice', 'addon')),
  kitchen VARCHAR(10) NOT NULL CHECK (kitchen IN ('front', 'back')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Create Menu Item
```http
POST /api/menu
Content-Type: application/json

{
  "name": "Chicken Curry",
  "halfPrice": 250.00,
  "fullPrice": 450.00,
  "category": "main",
  "kitchen": "back"
}
```

Response:
```json
{
  "id": "M72704501",
  "name": "Chicken Curry",
  "halfPrice": 250.00,
  "fullPrice": 450.00,
  "category": "main",
  "kitchen": "back"
}
```

### Update Menu Item
```http
PUT /api/menu/:id
Content-Type: application/json

{
  "halfPrice": 275.00,
  "fullPrice": 475.00
}
```

### Delete Menu Item
```http
DELETE /api/menu/:id
```

## Validation Rules

1. **Product Name**: Required, cannot be empty
2. **Half Price**: Required, must be positive number
3. **Full Price**: Required, must be positive and >= half price
4. **Category**: Must be 'main', 'rice', or 'addon'
5. **Kitchen**: Must be 'front' or 'back'

## UI/UX Features

- **Gradient purple theme** for admin panel
- **Icon-based tabs** for easy navigation
- **Real-time form validation**
- **Loading spinners** during submission
- **Success/Error notifications**
- **Responsive design** works on all screen sizes
- **Keyboard accessible**
- **Auto-close on success** (optional)

## Future Enhancements (Suggestions)

1. **Edit existing products** - Add edit functionality
2. **Delete products** - Add delete confirmation dialog
3. **Product categories management** - Add/remove categories
4. **Image upload** - Add product images
5. **Bulk import** - Import multiple products from CSV
6. **Admin authentication** - Protect admin panel with password
7. **Product availability** - Toggle products on/off without deleting
8. **Price history** - Track price changes over time

## Troubleshooting

**Issue: 500 Error when adding product**
- Solution: Backend generates unique IDs automatically now (fixed)

**Issue: Products not showing up**
- Check backend server is running
- Check database connection
- Verify product was added (check console logs)

**Issue: Validation errors**
- Ensure all required fields are filled
- Check price values are positive numbers
- Full price must be >= half price

## Testing

To test the feature:
1. Add a main dish (e.g., "Fish Curry", 300/500)
2. Add a rice option (e.g., "Basmati Rice", 50/100)
3. Add an addon (e.g., "Papadum", 20/30)
4. Verify items appear in menu sections
5. Try creating an order with the new items

## Files Modified/Created

**Created:**
- `src/components/AdminPanel.tsx`
- `ADMIN_PANEL_FEATURE.md` (this file)

**Modified:**
- `src/App.tsx` - Added admin button and modal
- `src/services/api.ts` - Added menu CRUD operations
- `backend/src/routes/menu.ts` - Added POST, PUT, DELETE endpoints

---

**Date Created:** October 11, 2025
**Status:** ✅ Completed and Working
