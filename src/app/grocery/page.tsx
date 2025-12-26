'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PrintIcon from '@mui/icons-material/Print';
import { Recipe, GroceryList, GroceryItem } from '@/types';

export default function GroceryPage() {
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [listName, setListName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchData = async () => {
    try {
      const [groceryRes, recipesRes] = await Promise.all([
        fetch('/api/grocery'),
        fetch('/api/recipes'),
      ]);

      if (groceryRes.ok) setGroceryLists(await groceryRes.json());
      if (recipesRes.ok) setRecipes(await recipesRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateList = async () => {
    if (selectedRecipes.length === 0) {
      setSnackbar({ open: true, message: 'Please select at least one recipe', severity: 'error' });
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: listName || undefined,
          recipeIds: selectedRecipes.map(r => r.id),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create list');
      }

      setSnackbar({ open: true, message: 'Grocery list created!', severity: 'success' });
      setCreateDialogOpen(false);
      setSelectedRecipes([]);
      setListName('');
      fetchData();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to create list',
        severity: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleItem = async (listId: string, itemId: string, checked: boolean) => {
    const list = groceryLists.find(l => l.id === listId);
    if (!list) return;

    const updatedItems = list.items.map(item =>
      item.id === itemId ? { ...item, checked } : item
    );

    try {
      await fetch(`/api/grocery?id=${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      });

      setGroceryLists(lists =>
        lists.map(l => l.id === listId ? { ...l, items: updatedItems } : l)
      );
    } catch {
      setSnackbar({ open: true, message: 'Failed to update item', severity: 'error' });
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const response = await fetch(`/api/grocery?id=${listId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setSnackbar({ open: true, message: 'List deleted', severity: 'success' });
      fetchData();
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete list', severity: 'error' });
    }
  };

  const handlePrint = (list: GroceryList) => {
    const printContent = `
      <html>
        <head>
          <title>${list.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { margin-bottom: 20px; }
            .category { margin-bottom: 15px; }
            .category-title { font-weight: bold; margin-bottom: 5px; }
            ul { list-style: none; padding-left: 0; }
            li { padding: 3px 0; }
            .checkbox { display: inline-block; width: 14px; height: 14px; border: 1px solid #000; margin-right: 8px; }
          </style>
        </head>
        <body>
          <h1>${list.name}</h1>
          ${Object.entries(groupItemsByCategory(list.items)).map(([category, items]) => `
            <div class="category">
              <div class="category-title">${category}</div>
              <ul>
                ${items.map(item => `
                  <li>
                    <span class="checkbox"></span>
                    ${item.quantity ? `${item.quantity} ` : ''}${item.name}
                  </li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const groupItemsByCategory = (items: GroceryItem[]): Record<string, GroceryItem[]> => {
    return items.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, GroceryItem[]>);
  };

  const categoryOrder = ['Produce', 'Meat & Seafood', 'Dairy', 'Bakery', 'Pantry', 'Frozen', 'Beverages', 'Other'];

  const sortedCategories = (items: GroceryItem[]) => {
    const grouped = groupItemsByCategory(items);
    return categoryOrder.filter(cat => grouped[cat]).map(cat => ({ category: cat, items: grouped[cat] }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Grocery Lists
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New List
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : groceryLists.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {groceryLists.map(list => {
            const checkedCount = list.items.filter(i => i.checked).length;
            const totalCount = list.items.length;

            return (
              <Card key={list.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {list.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {checkedCount}/{totalCount} items checked
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton onClick={() => handlePrint(list)} title="Print list">
                        <PrintIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteList(list.id)} color="error" title="Delete list">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Chip
                    label={`${Math.round((checkedCount / totalCount) * 100)}% complete`}
                    size="small"
                    color={checkedCount === totalCount ? 'success' : 'default'}
                    sx={{ mb: 2 }}
                  />

                  {sortedCategories(list.items).map(({ category, items }) => (
                    <Accordion key={category} defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography fontWeight={600}>{category}</Typography>
                        <Chip
                          label={`${items.filter(i => i.checked).length}/${items.length}`}
                          size="small"
                          sx={{ ml: 2 }}
                        />
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        <List dense disablePadding>
                          {items.map(item => (
                            <ListItem key={item.id} disablePadding>
                              <ListItemButton
                                onClick={() => handleToggleItem(list.id, item.id, !item.checked)}
                                dense
                              >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <Checkbox
                                    edge="start"
                                    checked={item.checked}
                                    tabIndex={-1}
                                    disableRipple
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={item.name}
                                  secondary={item.quantity}
                                  sx={{
                                    textDecoration: item.checked ? 'line-through' : 'none',
                                    color: item.checked ? 'text.disabled' : 'text.primary',
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ) : (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <ShoppingCartIcon sx={{ fontSize: 60, color: 'primary.light', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No grocery lists yet
          </Typography>
          <Typography color="text.secondary" paragraph>
            Create a grocery list from your saved recipes to make shopping easier!
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Your First List
          </Button>
        </Card>
      )}

      {/* Create List Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Grocery List</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="List Name (optional)"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder={`Grocery List - ${new Date().toLocaleDateString()}`}
              fullWidth
            />

            <Autocomplete
              multiple
              options={recipes}
              getOptionLabel={(option) => option.title}
              value={selectedRecipes}
              onChange={(_, newValue) => setSelectedRecipes(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Recipes"
                  placeholder="Choose recipes..."
                  helperText="Select the recipes you want to shop for"
                />
              )}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <li key={key} {...rest}>
                    <Box>
                      <Typography>{option.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.ingredients.length} ingredients
                      </Typography>
                    </Box>
                  </li>
                );
              }}
            />

            {selectedRecipes.length > 0 && (
              <Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Selected recipes: {selectedRecipes.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total ingredients: {selectedRecipes.reduce((sum, r) => sum + r.ingredients.length, 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  AI will consolidate and categorize your grocery list
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateList}
            variant="contained"
            disabled={creating || selectedRecipes.length === 0}
            startIcon={creating ? <CircularProgress size={20} /> : null}
          >
            {creating ? 'Creating...' : 'Create List'}
          </Button>
        </DialogActions>
      </Dialog>

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
