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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Recipe } from '@/types';
import EditRecipeDialog from '@/components/EditRecipeDialog';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

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
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

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

  const handleRecipeUpdated = (updatedRecipe: Recipe) => {
    setRecipe(updatedRecipe);
    setImgError(false); // Reset image error in case cover image changed
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
        {(recipe.coverImage || !imgError) && (
          <CardMedia
            component="img"
            height="300"
            image={imgError ? PLACEHOLDER_IMAGE : (recipe.coverImage || PLACEHOLDER_IMAGE)}
            alt={recipe.title}
            sx={{ objectFit: 'cover' }}
            onError={() => {
              if (!imgError) {
                setImgError(true);
              }
            }}
          />
        )}
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h4" component="h1" fontWeight={700}>
              {recipe.title}
            </Typography>
            <Box>
              <IconButton onClick={() => setEditDialogOpen(true)} title="Edit recipe">
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

      {/* Edit Recipe Dialog */}
      <EditRecipeDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={handleRecipeUpdated}
        recipe={recipe}
        availableTags={availableTags}
      />

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
