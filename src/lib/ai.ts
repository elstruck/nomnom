import OpenAI from 'openai';
import { Recipe, MealLog, AISuggestion, GroceryItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Lazy-load the OpenAI client to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export async function generateMealSuggestions(
  recentMeals: { recipe: Recipe; log: MealLog }[],
  allRecipes: Recipe[],
  preferences?: string
): Promise<AISuggestion[]> {
  const openai = getOpenAIClient();

  const recentMealsSummary = recentMeals
    .map(m => `- ${m.log.date}: ${m.recipe.title} (${m.log.mealType})`)
    .join('\n');

  const savedRecipesSummary = allRecipes
    .map(r => `- ${r.title}: ${r.tags.join(', ')}`)
    .join('\n');

  const prompt = `You are a helpful meal planning assistant. Based on the user's recent meal history and their saved recipes, suggest new dinner ideas for the upcoming week.

Recent meals (last few weeks):
${recentMealsSummary || 'No recent meals logged'}

Saved recipes in their collection:
${savedRecipesSummary || 'No saved recipes yet'}

${preferences ? `User preferences: ${preferences}` : ''}

Please suggest 5-7 dinner ideas for the upcoming week. For each suggestion:
1. Consider variety (don't repeat what they've had recently)
2. Balance different cuisines and cooking styles
3. Include a mix of quick meals and more elaborate ones
4. Consider nutritional balance

Format your response as a JSON array with objects containing:
- recipeName: string
- description: string (brief, 1-2 sentences)
- reason: string (why you're suggesting this based on their history)

Return ONLY the JSON array, no other text.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano-2025-08-07',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices[0]?.message?.content || '[]';

  try {
    // Extract JSON from the response (handle potential markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
    console.error('Failed to parse AI response:', content);
    return [];
  }
}

export async function generateGroceryList(
  recipes: Recipe[],
  existingItems?: GroceryItem[]
): Promise<GroceryItem[]> {
  const openai = getOpenAIClient();

  const ingredientsList = recipes
    .map(r => `Recipe: ${r.title}\nIngredients:\n${r.ingredients.map(i => `- ${i}`).join('\n')}`)
    .join('\n\n');

  const existingItemsList = existingItems?.length
    ? `\nAlready have:\n${existingItems.map(i => `- ${i.name}`).join('\n')}`
    : '';

  const prompt = `You are a helpful grocery shopping assistant. Based on the following recipes, create a consolidated grocery list.

${ingredientsList}
${existingItemsList}

Please:
1. Combine similar ingredients (e.g., if multiple recipes need onions, list once with total quantity)
2. Categorize items by grocery store section
3. Exclude items they already have

Format your response as a JSON array with objects containing:
- name: string (ingredient name)
- quantity: string (combined amount needed)
- category: string (one of: "Produce", "Meat & Seafood", "Dairy", "Bakery", "Pantry", "Frozen", "Beverages", "Other")

Return ONLY the JSON array, no other text.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano-2025-08-07',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices[0]?.message?.content || '[]';

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const items = JSON.parse(jsonMatch[0]);
      return items.map((item: { name: string; quantity?: string; category?: string }) => ({
        id: uuidv4(),
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        checked: false,
      }));
    }
    return [];
  } catch {
    console.error('Failed to parse AI response:', content);
    return [];
  }
}

export async function extractRecipeFromUrl(url: string): Promise<{
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: string;
} | null> {
  const openai = getOpenAIClient();

  const prompt = `Visit this recipe URL and extract the recipe data:

URL: ${url}

Extract and return a JSON object with:
{
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity", ...],
  "instructions": ["Step 1 actual cooking instruction", "Step 2 actual cooking instruction", ...],
  "prepTime": "X minutes" or null,
  "cookTime": "X minutes" or null,
  "servings": "X servings" or null
}

IMPORTANT:
- Extract actual ingredient quantities (e.g., "1 lb asparagus", "12 slices bacon")
- Extract actual cooking steps, NOT article section headings
- If ingredients are in prose text, extract them
- Return the JSON object

Return ONLY the JSON object.`;

  try {
    const response = await openai.responses.create({
      model: 'gpt-5-nano-2025-08-07',
      tools: [{ type: 'web_search' }],
      input: prompt,
    });

    const content = response.output_text || '';

    // Handle null response
    if (content.trim().toLowerCase() === 'null') {
      return null;
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
        prepTime: parsed.prepTime,
        cookTime: parsed.cookTime,
        servings: parsed.servings,
      };
    }
    return null;
  } catch (error) {
    console.error('AI recipe extraction failed:', error);
    return null;
  }
}

export async function suggestTags(recipe: { title: string; ingredients: string[]; instructions: string[] }): Promise<string[]> {
  const openai = getOpenAIClient();

  const prompt = `Based on this recipe, suggest appropriate tags.

Title: ${recipe.title}
Ingredients: ${recipe.ingredients.slice(0, 10).join(', ')}
Instructions: ${recipe.instructions.slice(0, 3).join(' ')}

Suggest 3-5 tags from this list or create new relevant ones:
breakfast, lunch, dinner, dessert, appetizer, vegetarian, vegan, gluten-free, dairy-free, quick, healthy, comfort food, italian, mexican, asian, mediterranean, american, indian, soup, salad, pasta, chicken, beef, pork, seafood, baking

Return ONLY a JSON array of strings, no other text.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano-2025-08-07',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices[0]?.message?.content || '[]';

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
    console.error('Failed to parse AI response:', content);
    return [];
  }
}
