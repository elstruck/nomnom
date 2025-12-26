'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Chip,
  Button,
  Card,
  CardContent,
  CardMedia,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Recipe } from '@/types';

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const [recipeRes, tagsRes] = await Promise.all([
          fetch(`/api/recipes/${id}`),
          fetch('/api/tags'),
        ]);

        if (!recipeRes.ok) {
          throw new Error('Recipe not found');
        }

        const recipeData = await recipeRes.json();
        setRecipe(recipeData);
        setEditingTags(recipeData.tags);

        if (tagsRes.ok) {
          setAvailableTags(await tagsRes.json());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  const handleUpdateTags = async () => {
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: editingTags }),
      });

      if (!response.ok) throw new Error('Failed to update');

      const updated = await response.json();
      setRecipe(updated);
      setEditDialogOpen(false);
    } catch {
      setError('Failed to update tags');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      router.push('/recipes');
    } catch {
      setError('Failed to delete recipe');
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mb: 3 }} />
        <Skeleton variant="text" height={60} width="60%" />
        <Skeleton variant="text" height={30} width="40%" />
      </Box>
    );
  }

  if (error || !recipe) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Recipe not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/recipes')}>
          Back to Recipes
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push('/recipes')}
        sx={{ mb: 2 }}
      >
        Back to Recipes
      </Button>

      <Card sx={{ mb: 3 }}>
        {recipe.coverImage && (
          <CardMedia
            component="img"
            height="300"
            image={recipe.coverImage}
            alt={recipe.title}
            sx={{ objectFit: 'cover' }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h4" component="h1" fontWeight={700}>
              {recipe.title}
            </Typography>
            <Box>
              <IconButton onClick={() => setEditDialogOpen(true)} title="Edit tags">
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => setDeleteConfirmOpen(true)} color="error" title="Delete recipe">
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          {recipe.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {recipe.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
            {recipe.prepTime && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon color="action" />
                <Typography variant="body2">
                  <strong>Prep:</strong> {recipe.prepTime}
                </Typography>
              </Box>
            )}
            {recipe.cookTime && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon color="action" />
                <Typography variant="body2">
                  <strong>Cook:</strong> {recipe.cookTime}
                </Typography>
              </Box>
            )}
            {recipe.totalTime && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon color="action" />
                <Typography variant="body2">
                  <strong>Total:</strong> {recipe.totalTime}
                </Typography>
              </Box>
            )}
            {recipe.servings && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RestaurantIcon color="action" />
                <Typography variant="body2">
                  <strong>Servings:</strong> {recipe.servings}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {recipe.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Box>

          <Button
            variant="outlined"
            endIcon={<OpenInNewIcon />}
            href={recipe.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Original Recipe
          </Button>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Ingredients */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Ingredients
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {recipe.ingredients.length > 0 ? (
              <List dense>
                {recipe.ingredients.map((ingredient, index) => (
                  <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={ingredient} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">
                No ingredients found. Visit the original recipe for details.
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card sx={{ flex: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Instructions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {recipe.instructions.length > 0 ? (
              <List>
                {recipe.instructions.map((instruction, index) => (
                  <ListItem key={index} alignItems="flex-start" sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        {index + 1}
                      </Box>
                    </ListItemIcon>
                    <ListItemText primary={instruction} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">
                No instructions found. Visit the original recipe for details.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Edit Tags Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Tags</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            freeSolo
            options={availableTags}
            value={editingTags}
            onChange={(_, newValue) => setEditingTags(newValue)}
            sx={{ mt: 1 }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return <Chip key={key} label={option} size="small" {...tagProps} />;
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Add tags..."
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateTags} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Recipe?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &ldquo;{recipe.title}&rdquo;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
