import { NextRequest, NextResponse } from 'next/server';
import { getAllRecipes, addRecipe, deleteRecipe } from '@/lib/db';
import { scrapeRecipe, createRecipeFromScraped } from '@/lib/scraper';
import { suggestTags } from '@/lib/ai';

export async function GET() {
  try {
    const recipes = await getAllRecipes();
    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, tags: providedTags } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Scrape the recipe
    const scraped = await scrapeRecipe(url);

    // Auto-suggest tags if OpenAI is configured
    let tags = providedTags || [];
    if (process.env.OPENAI_API_KEY && tags.length === 0) {
      try {
        tags = await suggestTags(scraped);
      } catch (e) {
        console.error('Failed to auto-suggest tags:', e);
      }
    }

    // Create and save the recipe
    const recipe = createRecipeFromScraped(url, scraped, tags);
    await addRecipe(recipe);

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error('Error adding recipe:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add recipe' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    const deleted = await deleteRecipe(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
  }
}
