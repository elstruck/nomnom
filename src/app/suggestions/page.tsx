'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Slider,
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import { AISuggestion } from '@/types';

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weeksToLookBack, setWeeksToLookBack] = useState(4);
  const [preferences, setPreferences] = useState('');

  const handleGetSuggestions = async () => {
    setLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeksToLookBack,
          preferences: preferences || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchRecipe = (recipeName: string) => {
    const searchQuery = encodeURIComponent(`${recipeName} recipe`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          AI Meal Suggestions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Get personalized dinner suggestions based on your meal history
        </Typography>
      </Box>

      {/* Configuration */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Configure Suggestions
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              Look back period: {weeksToLookBack} week{weeksToLookBack !== 1 ? 's' : ''}
            </Typography>
            <Slider
              value={weeksToLookBack}
              onChange={(_, value) => setWeeksToLookBack(value as number)}
              min={1}
              max={8}
              marks
              valueLabelDisplay="auto"
              sx={{ maxWidth: 400 }}
            />
            <Typography variant="body2" color="text.secondary">
              How far back should we look at your meal history?
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Preferences (optional)"
              placeholder="e.g., 'more vegetarian options', 'quick weeknight meals', 'trying to eat healthier'..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              multiline
              rows={2}
            />
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={handleGetSuggestions}
            disabled={loading}
          >
            {loading ? 'Generating Suggestions...' : 'Get AI Suggestions'}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LightbulbIcon color="warning" />
              <Typography variant="h6" fontWeight={600}>
                Dinner Suggestions for This Week
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <List>
              {suggestions.map((suggestion, index) => (
                <ListItem
                  key={index}
                  alignItems="flex-start"
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 2,
                    p: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ListItemIcon sx={{ minWidth: 'auto' }}>
                        <RestaurantIcon color="primary" />
                      </ListItemIcon>
                      <Typography variant="h6" fontWeight={600}>
                        {suggestion.recipeName}
                      </Typography>
                    </Box>
                    <Chip
                      label={`Day ${index + 1}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  <ListItemText
                    primary={
                      <Typography variant="body1" paragraph>
                        {suggestion.description}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Typography variant="body2" color="primary.main" fontWeight={500}>
                          Why this?
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {suggestion.reason}
                        </Typography>
                      </Box>
                    }
                  />

                  <Box sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SearchIcon />}
                      onClick={() => handleSearchRecipe(suggestion.recipeName)}
                    >
                      Find Recipe
                    </Button>
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && suggestions.length === 0 && !error && (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <AutoAwesomeIcon sx={{ fontSize: 60, color: 'primary.light', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Ready to get inspired?
          </Typography>
          <Typography color="text.secondary" paragraph>
            Click the button above to get AI-powered meal suggestions based on your recent dinner history.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tip: Log more meals to get better, more personalized suggestions!
          </Typography>
        </Card>
      )}
    </Box>
  );
}
