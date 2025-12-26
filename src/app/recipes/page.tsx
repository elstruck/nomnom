'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Skeleton,
  Alert,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { Recipe } from '@/types';
import RecipeCard from '@/components/RecipeCard';
import AddRecipeDialog from '@/components/AddRecipeDialog';
import LogMealDialog from '@/components/LogMealDialog';

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [logMealDialogOpen, setLogMealDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchData = async () => {
    try {
      const [recipesRes, tagsRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/tags'),
      ]);

      if (recipesRes.ok) setRecipes(await recipesRes.json());
      if (tagsRes.ok) setTags(await tagsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (recipe: Recipe) => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setSnackbar({ open: true, message: 'Recipe deleted successfully', severity: 'success' });
      fetchData();
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete recipe', severity: 'error' });
    }
  };

  const handleLogMeal = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setLogMealDialogOpen(true);
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = searchQuery === '' ||
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = selectedTag === null || recipe.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const allUsedTags = [...new Set(recipes.flatMap(r => r.tags))];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Recipes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Recipe
        </Button>
      </Box>

      {/* Search and Filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="All"
            onClick={() => setSelectedTag(null)}
            color={selectedTag === null ? 'primary' : 'default'}
            variant={selectedTag === null ? 'filled' : 'outlined'}
          />
          {allUsedTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              color={selectedTag === tag ? 'primary' : 'default'}
              variant={selectedTag === tag ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      {/* Recipes Grid */}
      {loading ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3
        }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : filteredRecipes.length > 0 ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3
        }}>
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => router.push(`/recipes/${recipe.id}`)}
              onDelete={() => handleDelete(recipe)}
              onLogMeal={() => handleLogMeal(recipe)}
            />
          ))}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary" gutterBottom>
            {searchQuery || selectedTag ? 'No recipes match your search' : 'No recipes yet'}
          </Typography>
          {!searchQuery && !selectedTag && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Add Your First Recipe
            </Button>
          )}
        </Box>
      )}

      <AddRecipeDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={fetchData}
        availableTags={tags}
      />

      <LogMealDialog
        open={logMealDialogOpen}
        onClose={() => {
          setLogMealDialogOpen(false);
          setSelectedRecipe(undefined);
        }}
        onSuccess={() => {
          setSnackbar({ open: true, message: 'Meal logged successfully', severity: 'success' });
        }}
        recipes={recipes}
        preselectedRecipe={selectedRecipe}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
