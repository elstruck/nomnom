'use client';

import { useState } from 'react';
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
  Card,
  CardActionArea,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface AddRecipeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableTags: string[];
}

type DialogMode = 'select' | 'url' | 'manual';

interface ManualRecipeData {
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

const initialManualData: ManualRecipeData = {
  title: '',
  description: '',
  ingredients: [''],
  instructions: [''],
  prepTime: '',
  cookTime: '',
  servings: '',
  coverImage: '',
  tags: [],
};

export default function AddRecipeDialog({ open, onClose, onSuccess, availableTags }: AddRecipeDialogProps) {
  const [mode, setMode] = useState<DialogMode>('select');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualData, setManualData] = useState<ManualRecipeData>(initialManualData);

  const handleSubmitUrl = async () => {
    if (!url) {
      setError('Please enter a recipe URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, tags }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add recipe');
      }

      resetAndClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitManual = async (isDraft = false) => {
    if (!manualData.title) {
      setError('Please enter a recipe title');
      return;
    }

    const filteredIngredients = manualData.ingredients.filter(i => i.trim());
    const filteredInstructions = manualData.instructions.filter(i => i.trim());

    // Only validate ingredients/instructions for non-draft recipes
    if (!isDraft) {
      if (filteredIngredients.length === 0) {
        setError('Please add at least one ingredient');
        return;
      }

      if (filteredInstructions.length === 0) {
        setError('Please add at least one instruction');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/recipes/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualData.title,
          description: manualData.description,
          ingredients: filteredIngredients,
          instructions: filteredInstructions,
          prepTime: manualData.prepTime || undefined,
          cookTime: manualData.cookTime || undefined,
          servings: manualData.servings || undefined,
          coverImage: manualData.coverImage || undefined,
          tags: manualData.tags,
          isDraft,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create recipe');
      }

      resetAndClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recipe');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setMode('select');
    setUrl('');
    setTags([]);
    setError('');
    setManualData(initialManualData);
    onClose();
  };

  const handleClose = () => {
    if (!loading) {
      resetAndClose();
    }
  };

  const handleBack = () => {
    if (!loading) {
      setMode('select');
      setError('');
    }
  };

  const addIngredient = () => {
    setManualData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, ''],
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setManualData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => (i === index ? value : ing)),
    }));
  };

  const removeIngredient = (index: number) => {
    if (manualData.ingredients.length > 1) {
      setManualData(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index),
      }));
    }
  };

  const addInstruction = () => {
    setManualData(prev => ({
      ...prev,
      instructions: [...prev.instructions, ''],
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setManualData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => (i === index ? value : inst)),
    }));
  };

  const removeInstruction = (index: number) => {
    if (manualData.instructions.length > 1) {
      setManualData(prev => ({
        ...prev,
        instructions: prev.instructions.filter((_, i) => i !== index),
      }));
    }
  };

  // Selection mode
  if (mode === 'select') {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Add Recipe</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Card variant="outlined">
              <CardActionArea onClick={() => setMode('url')} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinkIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Paste from URL
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Import a recipe from a website
                    </Typography>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>

            <Card variant="outlined">
              <CardActionArea onClick={() => setMode('manual')} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EditIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Create from Scratch
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manually enter recipe details
                    </Typography>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // URL import mode
  if (mode === 'url') {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handleBack} size="small" disabled={loading}>
            <ArrowBackIcon />
          </IconButton>
          Add Recipe from URL
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Recipe URL"
              placeholder="https://www.example.com/recipe/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              fullWidth
              disabled={loading}
              InputProps={{
                startAdornment: <LinkIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />

            <Autocomplete
              multiple
              freeSolo
              options={availableTags}
              value={tags}
              onChange={(_, newValue) => setTags(newValue)}
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
                  label="Tags (optional)"
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
            onClick={handleSubmitUrl}
            variant="contained"
            disabled={loading || !url}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Adding...' : 'Add Recipe'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Manual entry mode
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={handleBack} size="small" disabled={loading}>
          <ArrowBackIcon />
        </IconButton>
        Create Recipe
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Basic Info */}
          <TextField
            label="Recipe Title"
            value={manualData.title}
            onChange={(e) => setManualData(prev => ({ ...prev, title: e.target.value }))}
            fullWidth
            required
            disabled={loading}
          />

          <TextField
            label="Description"
            value={manualData.description}
            onChange={(e) => setManualData(prev => ({ ...prev, description: e.target.value }))}
            fullWidth
            multiline
            rows={2}
            disabled={loading}
          />

          <TextField
            label="Cover Image URL (optional)"
            value={manualData.coverImage}
            onChange={(e) => setManualData(prev => ({ ...prev, coverImage: e.target.value }))}
            fullWidth
            disabled={loading}
            placeholder="https://..."
          />

          {/* Time and Servings */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Prep Time"
              value={manualData.prepTime}
              onChange={(e) => setManualData(prev => ({ ...prev, prepTime: e.target.value }))}
              placeholder="15 minutes"
              disabled={loading}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Cook Time"
              value={manualData.cookTime}
              onChange={(e) => setManualData(prev => ({ ...prev, cookTime: e.target.value }))}
              placeholder="30 minutes"
              disabled={loading}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Servings"
              value={manualData.servings}
              onChange={(e) => setManualData(prev => ({ ...prev, servings: e.target.value }))}
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
            {manualData.ingredients.map((ingredient, index) => (
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
                  disabled={loading || manualData.ingredients.length === 1}
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
            {manualData.instructions.map((instruction, index) => (
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
                  disabled={loading || manualData.instructions.length === 1}
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
            value={manualData.tags}
            onChange={(_, newValue) => setManualData(prev => ({ ...prev, tags: newValue }))}
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
                label="Tags (optional)"
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
          onClick={() => handleSubmitManual(true)}
          variant="outlined"
          disabled={loading || !manualData.title}
        >
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmitManual(false)}
          variant="contained"
          disabled={loading || !manualData.title}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Creating...' : 'Create Recipe'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
