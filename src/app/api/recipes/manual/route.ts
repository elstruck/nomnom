import { NextRequest, NextResponse } from 'next/server';
import { addRecipe } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      coverImage,
      tags = [],
      isDraft = false
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Only require ingredients and instructions for non-draft recipes
    if (!isDraft) {
      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return NextResponse.json({ error: 'At least one ingredient is required' }, { status: 400 });
      }

      if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
        return NextResponse.json({ error: 'At least one instruction is required' }, { status: 400 });
      }
    }

    const now = new Date().toISOString();

    const recipe = {
      id: uuidv4(),
      url: '', // No URL for manually created recipes
      title,
      description: description || undefined,
      coverImage: coverImage || undefined,
      images: coverImage ? [coverImage] : [],
      ingredients: ingredients || [],
      instructions: instructions || [],
      tags,
      prepTime: prepTime || undefined,
      cookTime: cookTime || undefined,
      totalTime: prepTime && cookTime ? `${prepTime} + ${cookTime}` : undefined,
      servings: servings || undefined,
      isDraft: isDraft || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const created = await addRecipe(recipe);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating manual recipe:', error);
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}
