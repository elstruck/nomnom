import { NextRequest, NextResponse } from 'next/server';
import { getAllRecipes, getMealLogsByDateRange, getRecipeById } from '@/lib/db';
import { generateMealSuggestions } from '@/lib/ai';
import { subWeeks, format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { weeksToLookBack = 4, preferences } = body;

    // Get recent meal logs
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subWeeks(new Date(), weeksToLookBack), 'yyyy-MM-dd');
    const recentMealLogs = await getMealLogsByDateRange(startDate, endDate);

    // Get all recipes
    const allRecipes = await getAllRecipes();

    // Build meal history with recipe details
    const recentMeals = await Promise.all(
      recentMealLogs
        .filter(log => log.mealType === 'dinner')
        .map(async log => {
          const recipe = await getRecipeById(log.recipeId);
          return recipe ? { recipe, log } : null;
        })
    );

    const validMeals = recentMeals.filter((m): m is NonNullable<typeof m> => m !== null);

    // Generate suggestions
    const suggestions = await generateMealSuggestions(validMeals, allRecipes, preferences);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
