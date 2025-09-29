import { MenuItem } from '../types';

export const mainDishes: MenuItem[] = [
  { id: '1', name: 'Chicken', halfPrice: 580, fullPrice: 800, category: 'main' },
  { id: '2', name: 'Roast Chicken', halfPrice: 700, fullPrice: 900, category: 'main' },
  { id: '3', name: 'Fish (Thalapath)', halfPrice: 650, fullPrice: 800, category: 'main' },
  { id: '4', name: 'Fish (Abulthiyal)', halfPrice: 600, fullPrice: 850, category: 'main' },
  { id: '5', name: 'Fish Stew', halfPrice: 650, fullPrice: 850, category: 'main' },
  { id: '6', name: 'Fried Fish', halfPrice: 700, fullPrice: 800, category: 'main' },
  { id: '7', name: 'Pork', halfPrice: 700, fullPrice: 850, category: 'main' },
  { id: '8', name: 'Pork Stew', halfPrice: 750, fullPrice: 950, category: 'main' },
  { id: '9', name: 'Prawns', halfPrice: 750, fullPrice: 900, category: 'main' },
  { id: '10', name: 'Cuttlefish', halfPrice: 700, fullPrice: 900, category: 'main' },
  { id: '11', name: 'Egg', halfPrice: 480, fullPrice: 650, category: 'main' },
  { id: '12', name: 'Vegetable', halfPrice: 400, fullPrice: 600, category: 'main' },
];

export const riceTypes: MenuItem[] = [
  { id: 'r1', name: 'Yellow Rice', halfPrice: 80, fullPrice: 80, category: 'rice' },
  { id: 'r2', name: 'Red Rice', halfPrice: 70, fullPrice: 70, category: 'rice' },
  { id: 'r3', name: 'White Rice', halfPrice: 60, fullPrice: 60, category: 'rice' },
  { id: 'r4', name: 'Basmati Rice', halfPrice: 90, fullPrice: 90, category: 'rice' },
];

export const addons: MenuItem[] = [
  { id: 'a1', name: 'Chicken Roast', halfPrice: 150, fullPrice: 150, category: 'addon' },
  { id: 'a2', name: 'Fish (Thalapath)', halfPrice: 120, fullPrice: 120, category: 'addon' },
  { id: 'a3', name: 'Fish (Abulthiyal)', halfPrice: 130, fullPrice: 130, category: 'addon' },
  { id: 'a4', name: 'Fish Stew', halfPrice: 120, fullPrice: 120, category: 'addon' },
  { id: 'a5', name: 'Fish Fried', halfPrice: 140, fullPrice: 140, category: 'addon' },
  { id: 'a6', name: 'Pork', halfPrice: 160, fullPrice: 160, category: 'addon' },
  { id: 'a7', name: 'Pork Stew', halfPrice: 170, fullPrice: 170, category: 'addon' },
  { id: 'a8', name: 'Prawns', halfPrice: 180, fullPrice: 180, category: 'addon' },
  { id: 'a9', name: 'Cuttlefish', halfPrice: 150, fullPrice: 150, category: 'addon' },
  { id: 'a10', name: 'Egg', halfPrice: 80, fullPrice: 80, category: 'addon' },
  { id: 'a11', name: 'Omlet', halfPrice: 90, fullPrice: 90, category: 'addon' },
  { id: 'a12', name: 'Poshan - Vegetable', halfPrice: 100, fullPrice: 100, category: 'addon' },
];