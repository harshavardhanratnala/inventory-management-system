import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import api from '../services/api';
import { 
  Container, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Chip,
  IconButton
} from '@mui/material';
import { Inventory as InventoryIcon, Restore as RestoreIcon, Warning as WarningIcon, Info as InfoIcon } from '@mui/icons-material';
import { format } from 'date-fns';

export default function ObsoletePage() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const [obsoleteProducts, setObsoleteProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restoreDialog, setRestoreDialog] = useState(null);

  useEffect(() => {
    fetchObsoleteProducts();
  }, []);

  const fetchObsoleteProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/obsolete');
      setObsoleteProducts(res.data);
    } catch (err) {
      console.error('Failed to load obsolete products:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(`Failed to load obsolete products. Status: ${err.response?.status || 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (productId) => {
    try {
      console.log('Attempting to restore product:', productId);
      
      // Add detailed logging
      console.log('Sending restore request to:', `/products/${productId}/restore`);
      
      const response = await api.put(`/products/${productId}/restore`);
      console.log('Restore successful:', response.data);
      
      fetchObsoleteProducts();
      setRestoreDialog(null);
      
      // Show success message
      setError('success:Product restored successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      console.error('Failed to restore product:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: `/products/${productId}/restore`
      });
      
      let errorMessage = 'Failed to restore product';
      
      if (err.response?.status === 404) {
        errorMessage = 'Product not found';
      } else if (err.response?.status === 400 && err.response?.data?.error === 'Validation error') {
        errorMessage = `Validation error: ${err.response.data.details}`;
      } else if (err.response?.data?.msg) {
        errorMessage = err.response.data.msg;
      } else if (err.response?.data?.error) {
        errorMessage = `Server error: ${err.response.data.error}`;
        if (err.response.data.details) {
          errorMessage += ` - ${err.response.data.details}`;
        }
      }
      
      setError(`error:${errorMessage}`);
    }
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (err) {
      return 'Invalid Date';
    }
  };

  const getDaysSinceObsolete = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const obsoleteDate = new Date(dateString);
      const today = new Date();
      const diffTime = today - obsoleteDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (err) {
      return 'N/A';
    }
  };

  // Show loading state while checking role
  if (roleLoading) {
    return (
      <Container maxWidth="xl" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Checking permissions...
        </Typography>
      </Container>
    );
  }

  // Show loading state while fetching data
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading obsolete products...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <WarningIcon fontSize="large" color="primary" />
        </Grid>
        <Grid item xs>
          <Typography variant="h4" component="h1">
            Obsolete Products
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View and manage products marked as obsolete
          </Typography>
        </Grid>
      </Grid>

      {error && (
        <Alert 
          severity={error.startsWith('success:') ? 'success' : 
                   error.startsWith('error:') ? 'error' : 'info'} 
          sx={{ mb: 2 }} 
          onClose={() => setError('')}
        >
          {error.replace(/^(success|error):/, '')}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'background.default' }}>
              <TableCell><strong>Product ID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell align="right"><strong>Quantity</strong></TableCell>
              <TableCell align="right"><strong>Price</strong></TableCell>
              <TableCell><strong>Supplier</strong></TableCell>
              <TableCell><strong>Expiry Date</strong></TableCell>
              <TableCell><strong>Days Obsolete</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {obsoleteProducts.map((product) => (
              <TableRow 
                key={product._id} 
                hover
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  backgroundColor: 'action.hover'
                }}
              >
                <TableCell>{product.productId}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell align="right">
                  <Chip 
                    label={product.quantity} 
                    color={product.quantity < 10 ? "warning" : "success"}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </TableCell>
                <TableCell align="right">₹{product.price.toFixed(2)}</TableCell>
                <TableCell>{product.supplier?.name || 'N/A'}</TableCell>
                <TableCell>{formatExpiryDate(product.expiryDate)}</TableCell>
                <TableCell>
                  <Chip 
                    label={`${getDaysSinceObsolete(product.updatedAt)} days`} 
                    color="info" 
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {isAdmin && (
                    <IconButton 
                      size="small" 
                      color="success"
                      onClick={() => setRestoreDialog(product._id)}
                      title="Restore product"
                    >
                      <RestoreIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Restore Product Dialog */}
      {restoreDialog && (
        <Dialog open={true} onClose={() => setRestoreDialog(null)}>
          <DialogTitle>Restore Product</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Are you sure you want to restore this product to active inventory?
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              This will move the product back to the main inventory list.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRestoreDialog(null)} color="secondary">
              Cancel
            </Button>
            <Button 
              onClick={() => handleRestore(restoreDialog)} 
              color="success" 
              variant="contained"
            >
              Restore Product
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}