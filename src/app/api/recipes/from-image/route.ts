import { NextRequest, NextResponse } from 'next/server';
import { extractRecipeFromImage } from '@/lib/ai';
import { addRecipe } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { image, tags = [] } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Extract recipe data from image using AI
    const extractedData = await extractRecipeFromImage(image);

    if (!extractedData) {
      return NextResponse.json(
        { error: 'Could not extract recipe from image. Please try a clearer image or enter the recipe manually.' },
        { status: 400 }
      );
    }

    // Create the recipe
    const now = new Date().toISOString();
    const recipe = {
      id: uuidv4(),
      url: '',
      title: extractedData.title,
      description: extractedData.description,
      coverImage: undefined,
      images: [],
      ingredients: extractedData.ingredients,
      instructions: extractedData.instructions,
      tags,
      prepTime: extractedData.prepTime,
      cookTime: extractedData.cookTime,
      totalTime: extractedData.prepTime && extractedData.cookTime
        ? `${extractedData.prepTime} + ${extractedData.cookTime}`
        : extractedData.prepTime || extractedData.cookTime,
      servings: extractedData.servings,
      isDraft: false,
      createdAt: now,
      updatedAt: now,
    };

    const savedRecipe = await addRecipe(recipe);

    return NextResponse.json(savedRecipe, { status: 201 });
  } catch (error) {
    console.error('Error processing recipe image:', error);

    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process recipe image' },
      { status: 500 }
    );
  }
}
