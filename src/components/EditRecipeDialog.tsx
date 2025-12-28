'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
  Typography,
  IconButton,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Recipe } from '@/types';

interface EditRecipeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (recipe: Recipe) => void;
  recipe: Recipe;
  availableTags: string[];
}

interface RecipeFormData {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  servings: string;
  coverImage: string;
  tags: string[];
}

export default function EditRecipeDialog({
  open,
  onClose,
  onSuccess,
  recipe,
  availableTags
}: EditRecipeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    description: '',
    ingredients: [''],
    instructions: [''],
    prepTime: '',
    cookTime: '',
    servings: '',
    coverImage: '',
    tags: [],
  });

  useEffect(() => {
    if (open && recipe) {
      setFormData({
        title: recipe.title || '',
        description: recipe.description || '',
        ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [''],
        instructions: recipe.instructions.length > 0 ? recipe.instructions : [''],
        prepTime: recipe.prepTime || '',
        cookTime: recipe.cookTime || '',
        servings: recipe.servings || '',
        coverImage: recipe.coverImage || '',
        tags: recipe.tags || [],
      });
      setError('');
    }
  }, [open, recipe]);

  const handleSubmit = async () => {
    if (!formData.title) {
      setError('Please enter a recipe title');
      return;
    }

    const filteredIngredients = formData.ingredients.filter(i => i.trim());
    const filteredInstructions = formData.instructions.filter(i => i.trim());

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          ingredients: filteredIngredients,
          instructions: filteredInstructions,
          prepTime: formData.prepTime || undefined,
          cookTime: formData.cookTime || undefined,
          servings: formData.servings || undefined,
          coverImage: formData.coverImage || undefined,
          tags: formData.tags,
          isDraft: false,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update recipe');
      }

      const updatedRecipe = await response.json();
      onSuccess(updatedRecipe);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, ''],
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => (i === index ? value : ing)),
    }));
  };

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index),
      }));
    }
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, ''],
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => (i === index ? value : inst)),
    }));
  };

  const removeInstruction = (index: number) => {
    if (formData.instructions.length > 1) {
      setFormData(prev => ({
        ...prev,
        instructions: prev.instructions.filter((_, i) => i !== index),
      }));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Recipe</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Basic Info */}
          <TextField
            label="Recipe Title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            fullWidth
            required
            disabled={loading}
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            fullWidth
            multiline
            rows={2}
            disabled={loading}
          />

          <TextField
            label="Cover Image URL (optional)"
            value={formData.coverImage}
            onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
            fullWidth
            disabled={loading}
            placeholder="https://..."
          />

          {/* Time and Servings */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Prep Time"
              value={formData.prepTime}
              onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value }))}
              placeholder="15 minutes"
              disabled={loading}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Cook Time"
              value={formData.cookTime}
              onChange={(e) => setFormData(prev => ({ ...prev, cookTime: e.target.value }))}
              placeholder="30 minutes"
              disabled={loading}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Servings"
              value={formData.servings}
              onChange={(e) => setFormData(prev => ({ ...prev, servings: e.target.value }))}
              placeholder="4 servings"
              disabled={loading}
              sx={{ flex: 1 }}
            />
          </Box>

          <Divider />

          {/* Ingredients */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Ingredients
            </Typography>
            {formData.ingredients.map((ingredient, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  value={ingredient}
                  onChange={(e) => updateIngredient(index, e.target.value)}
                  placeholder={`Ingredient ${index + 1} (e.g., "2 cups flour")`}
                  fullWidth
                  size="small"
                  disabled={loading}
                />
                <IconButton
                  onClick={() => removeIngredient(index)}
                  disabled={loading || formData.ingredients.length === 1}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={addIngredient}
              size="small"
              disabled={loading}
            >
              Add Ingredient
            </Button>
          </Box>

          <Divider />

          {/* Instructions */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Instructions
            </Typography>
            {formData.instructions.map((instruction, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
                <Typography
                  sx={{
                    minWidth: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    mt: 0.5,
                  }}
                >
                  {index + 1}
                </Typography>
                <TextField
                  value={instruction}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  placeholder={`Step ${index + 1}`}
                  fullWidth
                  size="small"
                  multiline
                  disabled={loading}
                />
                <IconButton
                  onClick={() => removeInstruction(index)}
                  disabled={loading || formData.instructions.length === 1}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={addInstruction}
              size="small"
              disabled={loading}
            >
              Add Step
            </Button>
          </Box>

          <Divider />

          {/* Tags */}
          <Autocomplete
            multiple
            freeSolo
            options={availableTags}
            value={formData.tags}
            onChange={(_, newValue) => setFormData(prev => ({ ...prev, tags: newValue }))}
            disabled={loading}
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
                helperText="Press Enter to add custom tags"
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.title}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
