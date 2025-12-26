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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import { format } from 'date-fns';
import { Recipe } from '@/types';

interface LogMealDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recipes: Recipe[];
  preselectedRecipe?: Recipe;
}

export default function LogMealDialog({
  open,
  onClose,
  onSuccess,
  recipes,
  preselectedRecipe,
}: LogMealDialogProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(preselectedRecipe || null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedRecipe) {
      setError('Please select a recipe');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: selectedRecipe.id,
          date,
          mealType,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to log meal');
      }

      setSelectedRecipe(null);
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setMealType('dinner');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log meal');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedRecipe(null);
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setMealType('dinner');
      setNotes('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Log a Meal</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Autocomplete
            options={recipes}
            getOptionLabel={(option) => option.title}
            value={selectedRecipe}
            onChange={(_, newValue) => setSelectedRecipe(newValue)}
            disabled={loading}
            renderInput={(params) => (
              <TextField {...params} label="Select Recipe" placeholder="Search recipes..." />
            )}
          />

          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            disabled={loading}
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth disabled={loading}>
            <InputLabel>Meal Type</InputLabel>
            <Select
              value={mealType}
              label="Meal Type"
              onChange={(e) => setMealType(e.target.value as typeof mealType)}
            >
              <MenuItem value="breakfast">Breakfast</MenuItem>
              <MenuItem value="lunch">Lunch</MenuItem>
              <MenuItem value="dinner">Dinner</MenuItem>
              <MenuItem value="snack">Snack</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={2}
            disabled={loading}
            placeholder="Any notes about this meal..."
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
          disabled={loading || !selectedRecipe}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Logging...' : 'Log Meal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
