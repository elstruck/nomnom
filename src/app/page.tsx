'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Skeleton,
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import { Recipe, MealLog } from '@/types';
import RecipeCard from '@/components/RecipeCard';
import AddRecipeDialog from '@/components/AddRecipeDialog';

export default function Home() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [recipesRes, mealsRes, tagsRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/meals'),
        fetch('/api/tags'),
      ]);

      if (recipesRes.ok) setRecipes(await recipesRes.json());
      if (mealsRes.ok) setMealLogs(await mealsRes.json());
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

  const stats = [
    {
      label: 'Total Recipes',
      value: recipes.length,
      icon: <RestaurantMenuIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      action: () => router.push('/recipes'),
    },
    {
      label: 'Meals Logged',
      value: mealLogs.length,
      icon: <CalendarMonthIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      action: () => router.push('/meals'),
    },
    {
      label: 'Get Suggestions',
      value: 'AI',
      icon: <LightbulbIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      action: () => router.push('/suggestions'),
    },
    {
      label: 'Grocery Lists',
      value: 'Shop',
      icon: <ShoppingCartIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      action: () => router.push('/grocery'),
    },
  ];

  const recentRecipes = recipes.slice(-4).reverse();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
          Welcome to NomNom
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your personal recipe manager and meal planner
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3,
        mb: 4
      }}>
        {stats.map((stat) => (
          <Card
            key={stat.label}
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' },
            }}
            onClick={stat.action}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              {stat.icon}
              <Typography variant="h4" fontWeight={700} sx={{ my: 1 }}>
                {loading ? <Skeleton width={60} sx={{ mx: 'auto' }} /> : stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Quick Add */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          sx={{ px: 4, py: 1.5 }}
        >
          Add Recipe
        </Button>
      </Box>

      {/* Recent Recipes */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            Recent Recipes
          </Typography>
          {recipes.length > 4 && (
            <Button onClick={() => router.push('/recipes')}>View All</Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 3
          }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            ))}
          </Box>
        ) : recentRecipes.length > 0 ? (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 3
          }}>
            {recentRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => router.push(`/recipes/${recipe.id}`)}
              />
            ))}
          </Box>
        ) : (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" gutterBottom>
              No recipes yet. Add your first recipe to get started!
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Add Recipe
            </Button>
          </Card>
        )}
      </Box>

      <AddRecipeDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={fetchData}
        availableTags={tags}
      />
    </Box>
  );
}
