'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Skeleton,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Recipe, MealLog } from '@/types';
import LogMealDialog from '@/components/LogMealDialog';

interface MealWithRecipe extends MealLog {
  recipe?: Recipe;
}

const mealTypeColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning'> = {
  breakfast: 'warning',
  lunch: 'primary',
  dinner: 'secondary',
  snack: 'success',
};

export default function MealsPage() {
  const [meals, setMeals] = useState<MealWithRecipe[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [currentMonth] = useState(new Date());

  const fetchData = async () => {
    try {
      const [mealsRes, recipesRes] = await Promise.all([
        fetch('/api/meals'),
        fetch('/api/recipes'),
      ]);

      if (recipesRes.ok) {
        const recipesData = await recipesRes.json();
        setRecipes(recipesData);

        if (mealsRes.ok) {
          const mealsData: MealLog[] = await mealsRes.json();
          const mealsWithRecipes = mealsData.map(meal => ({
            ...meal,
            recipe: recipesData.find((r: Recipe) => r.id === meal.recipeId),
          }));
          setMeals(mealsWithRecipes.sort((a, b) => b.date.localeCompare(a.date)));
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (mealId: string) => {
    try {
      const response = await fetch(`/api/meals?id=${mealId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setSnackbar({ open: true, message: 'Meal log deleted', severity: 'success' });
      fetchData();
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete meal log', severity: 'error' });
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getMealsForDay = (date: Date) => {
    return meals.filter(meal => isSameDay(parseISO(meal.date), date));
  };

  // Group meals by date for the list view
  const mealsByDate = meals.reduce((acc, meal) => {
    const date = meal.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(meal);
    return acc;
  }, {} as Record<string, MealWithRecipe[]>);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Meal Log
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setLogDialogOpen(true)}
        >
          Log Meal
        </Button>
      </Box>

      {/* Calendar View */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Box key={day} sx={{ textAlign: 'center', fontWeight: 600, color: 'text.secondary', py: 1 }}>
                {day}
              </Box>
            ))}
            {/* Empty cells for days before the month starts */}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <Box key={`empty-${i}`} />
            ))}
            {daysInMonth.map(day => {
              const dayMeals = getMealsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <Box
                  key={day.toISOString()}
                  sx={{
                    p: 1,
                    minHeight: 60,
                    borderRadius: 1,
                    backgroundColor: isToday ? 'primary.light' : 'background.paper',
                    border: '1px solid',
                    borderColor: isToday ? 'primary.main' : 'divider',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isToday ? 700 : 400,
                      color: isToday ? 'white' : 'text.primary',
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {dayMeals.slice(0, 3).map(meal => (
                      <Box
                        key={meal.id}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: `${mealTypeColors[meal.mealType]}.main`,
                        }}
                        title={`${meal.mealType}: ${meal.recipe?.title || 'Unknown'}`}
                      />
                    ))}
                    {dayMeals.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        +{dayMeals.length - 3}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Meal List */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Recent Meals
      </Typography>

      {loading ? (
        <Box>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1 }} />
          ))}
        </Box>
      ) : meals.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Meal</TableCell>
                <TableCell>Recipe</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(mealsByDate).map(([date, dateMeals]) => (
                dateMeals.map((meal, index) => (
                  <TableRow key={meal.id}>
                    {index === 0 && (
                      <TableCell rowSpan={dateMeals.length} sx={{ fontWeight: 600 }}>
                        {format(parseISO(date), 'EEE, MMM d')}
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip
                        label={meal.mealType}
                        size="small"
                        color={mealTypeColors[meal.mealType]}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {meal.recipe?.coverImage && (
                          <Avatar
                            src={meal.recipe.coverImage}
                            sx={{ width: 32, height: 32 }}
                          />
                        )}
                        {meal.recipe?.title || 'Unknown Recipe'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                        {meal.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(meal.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>
            No meals logged yet. Start tracking what you eat!
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setLogDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            Log Your First Meal
          </Button>
        </Card>
      )}

      <LogMealDialog
        open={logDialogOpen}
        onClose={() => setLogDialogOpen(false)}
        onSuccess={() => {
          setSnackbar({ open: true, message: 'Meal logged successfully', severity: 'success' });
          fetchData();
        }}
        recipes={recipes}
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
