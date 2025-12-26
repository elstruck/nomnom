export interface Recipe {
  id: string;
  url: string;
  title: string;
  description?: string;
  coverImage?: string;
  images: string[];
  ingredients: string[];
  instructions: string[];
  tags: string[];
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealLog {
  id: string;
  recipeId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes?: string;
  createdAt: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  category?: string;
  checked: boolean;
  recipeId?: string;
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Database {
  recipes: Recipe[];
  mealLogs: MealLog[];
  groceryLists: GroceryList[];
  tags: string[];
}

export interface AISuggestion {
  recipeName: string;
  description: string;
  reason: string;
  searchUrl?: string;
}
