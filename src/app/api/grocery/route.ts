import { NextRequest, NextResponse } from 'next/server';
import {
  getAllGroceryLists,
  addGroceryList,
  getGroceryListById,
  updateGroceryList,
  deleteGroceryList,
  getRecipeById,
} from '@/lib/db';
import { generateGroceryList } from '@/lib/ai';
import { GroceryList, GroceryItem, Recipe } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const list = await getGroceryListById(id);
      if (!list) {
        return NextResponse.json({ error: 'Grocery list not found' }, { status: 404 });
      }
      return NextResponse.json(list);
    }

    const lists = await getAllGroceryLists();
    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching grocery lists:', error);
    return NextResponse.json({ error: 'Failed to fetch grocery lists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, recipeIds, useAI = true } = body;

    if (!recipeIds || recipeIds.length === 0) {
      return NextResponse.json({ error: 'At least one recipe ID is required' }, { status: 400 });
    }

    // Fetch recipes
    const recipes: Recipe[] = [];
    for (const id of recipeIds) {
      const recipe = await getRecipeById(id);
      if (recipe) {
        recipes.push(recipe);
      }
    }

    if (recipes.length === 0) {
      return NextResponse.json({ error: 'No valid recipes found' }, { status: 400 });
    }

    let items: GroceryItem[];

    if (useAI && process.env.OPENAI_API_KEY) {
      // Use AI to consolidate and categorize
      items = await generateGroceryList(recipes);
    } else {
      // Simple extraction without AI
      items = recipes.flatMap(recipe =>
        recipe.ingredients.map(ingredient => ({
          id: uuidv4(),
          name: ingredient,
          category: 'Other',
          checked: false,
          recipeId: recipe.id,
        }))
      );
    }

    const now = new Date().toISOString();
    const list: GroceryList = {
      id: uuidv4(),
      name: name || `Grocery List - ${new Date().toLocaleDateString()}`,
      items,
      createdAt: now,
      updatedAt: now,
    };

    await addGroceryList(list);
    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('Error creating grocery list:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create grocery list' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Grocery list ID is required' }, { status: 400 });
    }

    const updates = await request.json();
    const updated = await updateGroceryList(id, updates);

    if (!updated) {
      return NextResponse.json({ error: 'Grocery list not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating grocery list:', error);
    return NextResponse.json({ error: 'Failed to update grocery list' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Grocery list ID is required' }, { status: 400 });
    }

    const deleted = await deleteGroceryList(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Grocery list not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting grocery list:', error);
    return NextResponse.json({ error: 'Failed to delete grocery list' }, { status: 500 });
  }
}
