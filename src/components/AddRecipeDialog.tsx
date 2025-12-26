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
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';

interface AddRecipeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableTags: string[];
}

export default function AddRecipeDialog({ open, onClose, onSuccess, availableTags }: AddRecipeDialogProps) {
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
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

      setUrl('');
      setTags([]);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setUrl('');
      setTags([]);
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Recipe from URL</DialogTitle>
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
          onClick={handleSubmit}
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
