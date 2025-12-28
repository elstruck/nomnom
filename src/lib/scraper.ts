import * as cheerio from 'cheerio';
import { Recipe } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { extractRecipeFromUrl } from './ai';

interface ScrapedRecipe {
  title: string;
  description?: string;
  coverImage?: string;
  images: string[];
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
}

export async function scrapeRecipe(url: string): Promise<ScrapedRecipe> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Try to find JSON-LD structured data first (most reliable)
  const jsonLdData = extractJsonLd($);
  if (jsonLdData && jsonLdData.ingredients.length > 0) {
    return jsonLdData;
  }

  // Try HTML scraping
  const htmlData = scrapeFromHtml($, url);

  console.log('HTML scraping result:', {
    ingredients: htmlData.ingredients.length,
    instructions: htmlData.instructions.length,
  });

  // If HTML scraping found ingredients/instructions, use that
  if (htmlData.ingredients.length > 0 && htmlData.instructions.length > 0) {
    return htmlData;
  }

  // Fall back to AI extraction for sites without structured data
  console.log('Falling back to AI extraction...');
  try {
    const aiData = await extractRecipeFromUrl(url);
    console.log('AI extraction result:', aiData);
    if (aiData && aiData.ingredients.length > 0) {
      return {
        ...htmlData,
        ingredients: aiData.ingredients,
        instructions: aiData.instructions,
        prepTime: aiData.prepTime || htmlData.prepTime,
        cookTime: aiData.cookTime || htmlData.cookTime,
        servings: aiData.servings || htmlData.servings,
      };
    }
  } catch (error) {
    console.error('AI extraction failed, using HTML fallback:', error);
  }

  // Return whatever HTML scraping found (may be incomplete)
  return htmlData;
}

function extractJsonLd($: cheerio.CheerioAPI): ScrapedRecipe | null {
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    try {
      const content = $(scripts[i]).html();
      if (!content) continue;

      const data = JSON.parse(content);
      const recipe = findRecipeInJsonLd(data);

      if (recipe) {
        const name = typeof recipe.name === 'string' ? recipe.name : 'Untitled Recipe';
        const description = typeof recipe.description === 'string' ? recipe.description : undefined;

        return {
          title: name,
          description,
          coverImage: extractImage(recipe.image),
          images: extractImages(recipe.image),
          ingredients: extractIngredients(recipe.recipeIngredient),
          instructions: extractInstructions(recipe.recipeInstructions),
          prepTime: parseDuration(recipe.prepTime),
          cookTime: parseDuration(recipe.cookTime),
          totalTime: parseDuration(recipe.totalTime),
          servings: recipe.recipeYield?.toString(),
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

function findRecipeInJsonLd(data: unknown): Record<string, unknown> | null {
  if (!data) return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;

    if (obj['@type'] === 'Recipe' ||
        (Array.isArray(obj['@type']) && obj['@type'].includes('Recipe'))) {
      return obj;
    }

    if (obj['@graph'] && Array.isArray(obj['@graph'])) {
      return findRecipeInJsonLd(obj['@graph']);
    }
  }

  return null;
}

function extractImage(image: unknown): string | undefined {
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) return extractImage(image[0]);
  if (typeof image === 'object' && image !== null) {
    const obj = image as Record<string, unknown>;
    return (obj.url as string) || (obj['@id'] as string);
  }
  return undefined;
}

function extractImages(image: unknown): string[] {
  const images: string[] = [];

  if (typeof image === 'string') {
    images.push(image);
  } else if (Array.isArray(image)) {
    for (const img of image) {
      const extracted = extractImage(img);
      if (extracted) images.push(extracted);
    }
  } else if (typeof image === 'object' && image !== null) {
    const extracted = extractImage(image);
    if (extracted) images.push(extracted);
  }

  return images;
}

function extractIngredients(ingredients: unknown): string[] {
  if (!ingredients) return [];
  if (Array.isArray(ingredients)) {
    return ingredients.map(i => typeof i === 'string' ? i : String(i)).filter(Boolean);
  }
  return [];
}

function extractInstructions(instructions: unknown): string[] {
  if (!instructions) return [];

  if (typeof instructions === 'string') {
    return instructions.split('\n').filter(Boolean);
  }

  if (Array.isArray(instructions)) {
    return instructions.flatMap((instruction): string[] => {
      if (typeof instruction === 'string') return [instruction];
      if (typeof instruction === 'object' && instruction !== null) {
        const obj = instruction as Record<string, unknown>;
        if (obj['@type'] === 'HowToStep') {
          return [obj.text as string].filter(Boolean);
        }
        if (obj['@type'] === 'HowToSection' && Array.isArray(obj.itemListElement)) {
          return extractInstructions(obj.itemListElement);
        }
      }
      return [];
    });
  }

  return [];
}

function parseDuration(duration: unknown): string | undefined {
  if (typeof duration !== 'string') return undefined;

  // Parse ISO 8601 duration (e.g., PT1H30M)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

  return parts.join(' ') || undefined;
}

function scrapeFromHtml($: cheerio.CheerioAPI, url: string): ScrapedRecipe {
  // Get title
  let title = $('h1').first().text().trim() ||
              $('meta[property="og:title"]').attr('content') ||
              $('title').text().trim() ||
              'Untitled Recipe';

  // Get description
  const description = $('meta[property="og:description"]').attr('content') ||
                     $('meta[name="description"]').attr('content');

  // Get cover image
  const coverImage = $('meta[property="og:image"]').attr('content') ||
                    $('img').first().attr('src');

  // Get images
  const images: string[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src && !src.includes('icon') && !src.includes('logo')) {
      const fullUrl = src.startsWith('http') ? src : new URL(src, url).href;
      images.push(fullUrl);
    }
  });

  // Try to find ingredients
  const ingredients: string[] = [];
  const ingredientSelectors = [
    '[class*="ingredient"] li',
    '[class*="Ingredient"] li',
    '.ingredients li',
    '[data-ingredient]',
    'ul li:contains("cup")',
    'ul li:contains("tablespoon")',
    'ul li:contains("teaspoon")',
  ];

  for (const selector of ingredientSelectors) {
    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 200) {
        ingredients.push(text);
      }
    });
    if (ingredients.length > 0) break;
  }

  // Try to find instructions
  const instructions: string[] = [];
  const instructionSelectors = [
    '[class*="instruction"] li',
    '[class*="Instruction"] li',
    '[class*="direction"] li',
    '[class*="Direction"] li',
    '[class*="step"] li',
    '.instructions li',
    '.directions li',
    '.steps li',
    '[class*="instruction"] p',
    '[class*="step"] p',
  ];

  for (const selector of instructionSelectors) {
    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 10) {
        instructions.push(text);
      }
    });
    if (instructions.length > 0) break;
  }

  return {
    title,
    description,
    coverImage,
    images: images.slice(0, 10),
    ingredients,
    instructions,
  };
}

export function createRecipeFromScraped(url: string, scraped: ScrapedRecipe, tags: string[] = []): Recipe {
  const now = new Date().toISOString();

  return {
    id: uuidv4(),
    url,
    title: scraped.title,
    description: scraped.description,
    coverImage: scraped.coverImage,
    images: scraped.images,
    ingredients: scraped.ingredients,
    instructions: scraped.instructions,
    tags,
    prepTime: scraped.prepTime,
    cookTime: scraped.cookTime,
    totalTime: scraped.totalTime,
    servings: scraped.servings,
    createdAt: now,
    updatedAt: now,
  };
}
