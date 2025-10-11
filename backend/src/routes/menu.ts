import { Router, Request, Response } from 'express';
import { pool } from '../database/postgres';

const router = Router();

/**
 * GET /api/menu
 * Get all menu items
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, half_price as "halfPrice", full_price as "fullPrice", category, kitchen
       FROM menu_items
       ORDER BY 
         CASE category
           WHEN 'main' THEN 1
           WHEN 'rice' THEN 2
           WHEN 'addon' THEN 3
         END,
         name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting menu items:', error);
    res.status(500).json({ error: 'Failed to get menu items' });
  }
});

/**
 * GET /api/menu/:category
 * Get menu items by category
 */
router.get('/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;

    if (!['main', 'rice', 'addon'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const result = await pool.query(
      `SELECT id, name, half_price as "halfPrice", full_price as "fullPrice", category, kitchen
       FROM menu_items
       WHERE category = $1
       ORDER BY name`,
      [category]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting menu items by category:', error);
    res.status(500).json({ error: 'Failed to get menu items' });
  }
});

/**
 * POST /api/menu
 * Create a new menu item
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, halfPrice, fullPrice, category, kitchen } = req.body;

    if (!name || !halfPrice || !fullPrice || !category || !kitchen) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['main', 'rice', 'addon'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    if (!['front', 'back'].includes(kitchen)) {
      return res.status(400).json({ error: 'Invalid kitchen' });
    }

    // Generate a unique ID (using category prefix + timestamp + random)
    const prefix = category === 'main' ? 'M' : category === 'rice' ? 'R' : 'A';
    const id = `${prefix}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;

    const result = await pool.query(
      `INSERT INTO menu_items (id, name, half_price, full_price, category, kitchen)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, half_price as "halfPrice", full_price as "fullPrice", category, kitchen`,
      [id, name, halfPrice, fullPrice, category, kitchen]
    );

    console.log(`✅ Created menu item: ${name}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

/**
 * PUT /api/menu/:id
 * Update an existing menu item
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, halfPrice, fullPrice, category, kitchen } = req.body;

    if (category && !['main', 'rice', 'addon'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    if (kitchen && !['front', 'back'].includes(kitchen)) {
      return res.status(400).json({ error: 'Invalid kitchen' });
    }

    const result = await pool.query(
      `UPDATE menu_items
       SET name = COALESCE($1, name),
           half_price = COALESCE($2, half_price),
           full_price = COALESCE($3, full_price),
           category = COALESCE($4, category),
           kitchen = COALESCE($5, kitchen)
       WHERE id = $6
       RETURNING id, name, half_price as "halfPrice", full_price as "fullPrice", category, kitchen`,
      [name, halfPrice, fullPrice, category, kitchen, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    console.log(`✅ Updated menu item: ${result.rows[0].name}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

/**
 * DELETE /api/menu/:id
 * Delete a menu item
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM menu_items WHERE id = $1 RETURNING name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    console.log(`✅ Deleted menu item: ${result.rows[0].name}`);
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;
