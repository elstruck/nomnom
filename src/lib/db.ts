import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { Database, Recipe, MealLog, GroceryList } from '@/types';

const defaultData: Database = {
  recipes: [],
  mealLogs: [],
  groceryLists: [],
  tags: ['breakfast', 'lunch', 'dinner', 'dessert', 'appetizer', 'vegetarian', 'vegan', 'quick', 'healthy', 'comfort food'],
};

let db: Low<Database> | null = null;

export async function getDb(): Promise<Low<Database>> {
  const dbPath = path.join(process.cwd(), 'data', 'db.json');

  if (!db) {
    const adapter = new JSONFile<Database>(dbPath);
    db = new Low(adapter, defaultData);
  }

  // Always re-read from disk to get latest data
  await db.read();

  if (!db.data) {
    db.data = defaultData;
    await db.write();
  }

  return db;
}

// Recipe operations
export async function getAllRecipes(): Promise<Recipe[]> {
  const db = await getDb();
  return db.data.recipes;
}

export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  const db = await getDb();
  return db.data.recipes.find(r => r.id === id);
}

export async function addRecipe(recipe: Recipe): Promise<Recipe> {
  const db = await getDb();
  db.data.recipes.push(recipe);
  await db.write();
  return recipe;
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
  const db = await getDb();
  const index = db.data.recipes.findIndex(r => r.id === id);
  if (index === -1) return null;

  db.data.recipes[index] = { ...db.data.recipes[index], ...updates, updatedAt: new Date().toISOString() };
  await db.write();
  return db.data.recipes[index];
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const db = await getDb();
  const index = db.data.recipes.findIndex(r => r.id === id);
  if (index === -1) return false;

  db.data.recipes.splice(index, 1);
  // Also delete associated meal logs
  db.data.mealLogs = db.data.mealLogs.filter(m => m.recipeId !== id);
  await db.write();
  return true;
}

// Meal log operations
export async function getAllMealLogs(): Promise<MealLog[]> {
  const db = await getDb();
  return db.data.mealLogs;
}

export async function getMealLogsByDateRange(startDate: string, endDate: string): Promise<MealLog[]> {
  const db = await getDb();
  return db.data.mealLogs.filter(m => m.date >= startDate && m.date <= endDate);
}

export async function addMealLog(log: MealLog): Promise<MealLog> {
  const db = await getDb();
  db.data.mealLogs.push(log);
  await db.write();
  return log;
}

export async function deleteMealLog(id: string): Promise<boolean> {
  const db = await getDb();
  const index = db.data.mealLogs.findIndex(m => m.id === id);
  if (index === -1) return false;

  db.data.mealLogs.splice(index, 1);
  await db.write();
  return true;
}

// Grocery list operations
export async function getAllGroceryLists(): Promise<GroceryList[]> {
  const db = await getDb();
  return db.data.groceryLists;
}

export async function getGroceryListById(id: string): Promise<GroceryList | undefined> {
  const db = await getDb();
  return db.data.groceryLists.find(g => g.id === id);
}

export async function addGroceryList(list: GroceryList): Promise<GroceryList> {
  const db = await getDb();
  db.data.groceryLists.push(list);
  await db.write();
  return list;
}

export async function updateGroceryList(id: string, updates: Partial<GroceryList>): Promise<GroceryList | null> {
  const db = await getDb();
  const index = db.data.groceryLists.findIndex(g => g.id === id);
  if (index === -1) return null;

  db.data.groceryLists[index] = { ...db.data.groceryLists[index], ...updates, updatedAt: new Date().toISOString() };
  await db.write();
  return db.data.groceryLists[index];
}

export async function deleteGroceryList(id: string): Promise<boolean> {
  const db = await getDb();
  const index = db.data.groceryLists.findIndex(g => g.id === id);
  if (index === -1) return false;

  db.data.groceryLists.splice(index, 1);
  await db.write();
  return true;
}

// Tag operations
export async function getAllTags(): Promise<string[]> {
  const db = await getDb();
  return db.data.tags;
}

export async function addTag(tag: string): Promise<string[]> {
  const db = await getDb();
  if (!db.data.tags.includes(tag)) {
    db.data.tags.push(tag);
    await db.write();
  }
  return db.data.tags;
}
