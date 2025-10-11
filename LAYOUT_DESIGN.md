# Niyabalawa Restaurant POS - Layout Design

## 📋 Layout Structure (Matching Hand-Drawn Design)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER: Niyabalawa Restaurant | Set Menu Order System    [TOKEN: 001]  │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────┬────────────────────┬────────────────────────────────┐
│                    │                    │                                │
│  LEFT COLUMN       │  MIDDLE COLUMN     │  RIGHT COLUMN                  │
│  (33% width)       │  (33% width)       │  (33% width)                   │
│                    │                    │                                │
│ ┌────────────────┐ │ ┌────────────────┐ │ ┌────────────────────────────┐ │
│ │ SET MENU       │ │ │ DESSERT/DRINKS │ │ │ PRODUCTS                   │ │
│ │ (Rice & Curry) │ │ │ (Coming Soon)  │ │ │ Order Summary              │ │
│ └────────────────┘ │ └────────────────┘ │ └────────────────────────────┘ │
│                    │                    │                                │
│ Complete meals     │ ┌────────────────┐ │ [Dine In] [Take Away]          │
│ with white rice    │ │ ADD-ONS        │ │                                │
│                    │ │ Extra items    │ │ • 2x Chicken (Half) - 580      │
│ Item       | Half  │ └────────────────┘ │ • 1x Fish Stew (Full) - 850    │
│ Chicken    | [580] │                    │ • 1x Yellow Rice - 80          │
│ Roast Chkn | [700] │ Extra chicken      │ • 1x Prawns (Add-on) - 180     │
│ Fish (Tha) | [650] │ Extra fish         │                                │
│ ...        | ...   │ Extra pork         │ [Remove buttons & quantity]    │
│                    │ ...                │                                │
│                    │                    │ ────────────────────────────── │
│                    │                    │ TOTAL: Rs. 2,270.00            │
│                    │                    │ [🖨️ PRINT BILL]                │
│                    │                    │                                │
└────────────────────┴────────────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  FOOTER: Change Base Rice (Default: White Rice)                         │
│  [Yellow Rice +80/=] [Red Rice +70/=] [White Rice +60/=] [Basmati +90/=]│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Features Implemented

### **LEFT SECTION: SET MENU (Rice & Curry)**
- **Purpose**: Main meal options - complete set with rice included
- **Display**: Table format with item names and two columns (Half/Full)
- **Action**: Click on price button to add that portion to cart
- **Default**: All sets come with WHITE RICE by default
- **Color**: Green header to indicate "complete meal"

**Items Included:**
- Chicken (Half: 580 / Full: 800)
- Roast Chicken (Half: 700 / Full: 900)
- Fish - Thalapath, Abulthiyal, Stew, Fried
- Pork & Pork Stew
- Prawns, Cuttlefish
- Egg, Vegetable

---

### **MIDDLE SECTION: DESSERT/DRINKS & ADD-ONS**

#### Top: Dessert/Drinks
- **Status**: Placeholder - "Coming Soon..."
- **Purpose**: Future menu expansion area
- **Color**: Purple header

#### Bottom: Add-ons
- **Purpose**: Extra single items to enhance the main meal
- **Display**: Table with item name and single price column
- **Action**: Click price to add one unit to cart
- **Color**: Orange header to differentiate from main meals
- **Note**: These are NOT complete meals, just extras

**Items Included:**
- Chicken Roast (+150)
- Extra Fish varieties
- Extra Pork, Prawns, Cuttlefish
- Extra Egg, Omelet
- Poshan - Vegetable

---

### **RIGHT SECTION: PRODUCTS (Order Summary)**
- **Header**: Shows "PRODUCTS" and "Order Summary"
- **Order Type**: Toggle buttons for Dine In / Take Away
- **Product List**: Shows all added items with:
  - Quantity display (e.g., "2x")
  - Item name
  - Portion badge (HALF/FULL) if applicable
  - Unit price and total price
  - Quantity adjustment buttons (+/-)
  - Remove button for each item
- **Total**: Prominent display of total amount
- **Action Button**: Green "PRINT BILL" button (disabled when cart empty)

---

### **BOTTOM SECTION: Change Base Rice**
- **Purpose**: Upgrades the base rice for the entire meal
- **Default**: White Rice (free with set menu)
- **Options**: Yellow Rice (+80), Red Rice (+70), White Rice (+60), Basmati (+90)
- **Display Format**: Shows as "+[price]/=" to indicate additional cost
- **Color**: Amber/Gold buttons to indicate rice upgrade option
- **Behavior**: Clicking adds rice type to cart as additional item

---

## 💡 User Flow

1. **Customer arrives** → Cashier creates new order (Token number assigned)
2. **Select main meal** → Click Half or Full price in LEFT section
3. **Add extras** → Click add-on prices in MIDDLE section if needed
4. **Change rice** → Click rice type in BOTTOM if upgrading from white rice
5. **Review order** → Check RIGHT section for accuracy
6. **Adjust quantities** → Use +/- buttons to modify amounts
7. **Choose order type** → Dine In or Take Away
8. **Complete** → Click "PRINT BILL" to finalize

---

## 🎨 Design Principles

- **Clear Separation**: Three distinct columns prevent confusion
- **Color Coding**: 
  - Green = Complete meals (set menu)
  - Orange = Add-ons (extras)
  - Blue = Order summary
  - Amber = Rice upgrades
- **Table Format**: Clean, scannable list format for quick ordering
- **Single Click**: Most actions require just one click
- **Visual Hierarchy**: Headers clearly label each section
- **Responsive**: Works on different screen sizes

---

## 🔄 How Rice Selection Works

**Default Behavior:**
- Every set menu comes with WHITE RICE included in the price
- No need to select rice unless customer wants an upgrade

**When Customer Wants Different Rice:**
- Click the rice button at bottom (e.g., "Yellow Rice +80/=")
- This ADDS the upgrade cost to the total
- The set menu already includes rice, so this is just the upgrade fee

**Example:**
- Chicken Half = Rs. 580 (includes white rice)
- Customer wants Yellow Rice instead
- Click "Yellow Rice +80/=" 
- Total = 580 + 80 = Rs. 660

---

## ✅ Implementation Checklist

- [x] Three-column layout (Left: Set Menu, Middle: Add-ons, Right: Order)
- [x] Table format for menu items with clear price columns
- [x] Dessert/Drinks placeholder section
- [x] Add-ons section with single price column
- [x] Order summary with token display
- [x] Dine In / Take Away toggle
- [x] Rice type selector at bottom with "+price/=" format
- [x] Quantity adjustment controls
- [x] Remove item functionality
- [x] Total amount display
- [x] Print Bill button
- [x] Color-coded sections
- [x] Clean, professional design

---

**Last Updated**: October 9, 2025
**Version**: 1.0
**Status**: ✅ Complete
