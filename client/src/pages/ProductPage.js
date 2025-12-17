import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import api from '../services/api';
import { 
  Chip, 
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
  TextField,
  Alert,
  Grid,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Box,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Inventory as InventoryIcon, Warning as WarningIcon } from '@mui/icons-material';

export default function ProductPage() {
  const { user } = useAuth();
  const { isAdmin, isStaff, loading: roleLoading } = useRole();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openStockoutDialog, setOpenStockoutDialog] = useState(null);
  const [openObsoleteDialog, setOpenObsoleteDialog] = useState(null);
  const [newProduct, setNewProduct] = useState({
    productId: `P-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    quantity: 10,
    price: 0,
    supplier: '',
    manufacturedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    unit: 'pieces'
  });
  const [stockoutData, setStockoutData] = useState({ quantity: 1 });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [productsRes, suppliersRes] = await Promise.all([
          api.get('/products'),  // This will now correctly hit /api/products
          api.get('/suppliers')  // This will now correctly hit /api/suppliers
        ]);
        setProducts(productsRes.data);
        setSuppliers(suppliersRes.data);
      } catch (err) {
        console.error('Failed to load data:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError('Failed to load products and suppliers');
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  const handleAddProduct = async () => {
    try {
      console.log('Attempting to add product:', newProduct);
      setError('');
      setLoadingData(true);
      
      // This will now correctly POST to /api/products
      const res = await api.post('/products', newProduct);
      console.log('Product added successfully:', res.data);
      
      // Refresh data after successful creation
      const productsRes = await api.get('/products');
      setProducts(productsRes.data);
      
      setOpenAddDialog(false);
      setNewProduct({
        productId: `P-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        quantity: 10,
        price: 0,
        supplier: '',
        manufacturedDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        unit: 'pieces'
      });
    } catch (err) {
      console.error('Error adding product:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: '/api/products'
      });
      
      let errorMessage = 'Error adding product';
      if (err.response?.status === 400) {
        errorMessage = err.response.data.msg || 'Validation error';
      } else if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to add products';
      }
      
      setError(errorMessage);
      setLoadingData(false);
    }
  };

  const handleStockout = async (productId) => {
    try {
      console.log(`Attempting stock out for product ${productId} with quantity ${stockoutData.quantity}`);
      await api.put(`/products/${productId}/stockout`, {
        quantity: stockoutData.quantity
      });
      
      // Refresh data after successful stock out
      const productsRes = await api.get('/products');
      setProducts(productsRes.data);
      setOpenStockoutDialog(null);
      setStockoutData({ quantity: 1 });
    } catch (err) {
      console.error('Stock out failed:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setError(err.response?.data?.msg || 'Stock out failed');
    }
  };

  const handleMarkObsolete = async (productId) => {
    try {
      console.log(`Marking product ${productId} as obsolete`);
      await api.put(`/products/${productId}/obsolete`);
      
      // Refresh data after successful obsolete mark
      const productsRes = await api.get('/products');
      setProducts(productsRes.data);
      setOpenObsoleteDialog(null);
    } catch (err) {
      console.error('Mark obsolete failed:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setError('Failed to mark product as obsolete');
    }
  };

  const getProductInfo = (productId) => {
    if (!productId) return { name: 'Unknown Product' };
    
    const id = typeof productId === 'object' && productId._id ? productId._id : productId;
    const idStr = String(id);
    
    const product = products.find(p => {
      if (!p || !p._id) return false;
      return String(p._id) === idStr;
    });
    
    return product || { name: 'Unknown Product' };
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'low-stock': return 'warning';
      case 'out-of-stock': return 'error';
      case 'obsolete': return 'default';
      default: return 'success';
    }
  };

  const getStockStatus = (product) => {
    if (product.status === 'obsolete') return 'Obsolete';
    if (product.quantity === 0) return 'Out of Stock';
    if (product.quantity < 10) return 'Low Stock';
    return 'In Stock';
  };

  const formatExpiryDate = (expiryDate) => {
    if (!expiryDate) return 'N/A';
    try {
      return new Date(expiryDate).toLocaleDateString();
    } catch (err) {
      return 'Invalid Date';
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
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Checking permissions...
        </Typography>
      </Container>
    );
  }

  // Show loading state while fetching data
  if (loadingData) {
    return (
      <Container maxWidth="xl" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading inventory data...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <InventoryIcon fontSize="large" color="primary" />
        </Grid>
        <Grid item xs>
          <Typography variant="h4" component="h1">
            Product Inventory
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {isAdmin 
              ? 'Manage your product catalog and stock levels' 
              : 'View inventory and record stock out'}
          </Typography>
        </Grid>
        {isAdmin && (
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
            >
              Add Product
            </Button>
          </Grid>
        )}
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
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
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow 
                key={product._id} 
                hover
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  opacity: product.status === 'obsolete' ? 0.7 : 1
                }}
              >
                <TableCell>{product.productId}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell align="right">
                  <Box display="flex" flexDirection="column" alignItems="flex-end">
                    <Chip 
                      label={`${product.quantity} ${product.unit === 'kg' ? 'kg' : ''}`} 
                      color={product.quantity < 10 ? "warning" : "success"}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                    {product.unit === 'kg' && (
                      <Typography variant="caption" color="text.secondary">
                        ({(product.quantity * 1000).toFixed(0)} grams)
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">₹{product.price.toFixed(2)}</TableCell>
                <TableCell>{product.supplier?.name || 'N/A'}</TableCell>
                <TableCell>{formatExpiryDate(product.expiryDate)}</TableCell>
                <TableCell>
                  <Chip 
                    label={getStockStatus(product)} 
                    color={getStatusColor(product.status || 'active')} 
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {product.status !== 'obsolete' && isStaff && (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => setOpenStockoutDialog(product._id)}
                      disabled={product.quantity === 0}
                      sx={{ mr: 1 }}
                    >
                      Record Stock Out
                    </Button>
                  )}
                  {isAdmin && product.status !== 'obsolete' && (
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => setOpenObsoleteDialog(product._id)}
                      title="Mark as obsolete"
                    >
                      <WarningIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Product Dialog */}
      {isAdmin && (
        <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Product ID"
                  fullWidth
                  value={newProduct.productId}
                  InputProps={{ readOnly: true }}
                  sx={{ backgroundColor: 'background.default' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Product Name"
                  fullWidth
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Quantity"
                  type="number"
                  fullWidth
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({...newProduct, quantity: Number(e.target.value)})}
                  inputProps={{ min: 0 }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price (₹)"
                  type="number"
                  fullWidth
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                  inputProps={{ min: 0, step: "0.01" }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={newProduct.unit}
                    label="Unit"
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                  >
                    <MenuItem value="pieces">Pieces</MenuItem>
                    <MenuItem value="kg">Kilograms (kg)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    value={newProduct.supplier}
                    label="Supplier"
                    onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})}
                  >
                    {suppliers
                      .filter(supplier => supplier.supplierId)
                      .map((supplier) => (
                        <MenuItem key={supplier._id} value={supplier._id}>
                          {supplier.name} ({supplier.supplierId.replace('SUP-', '')}) - {supplier.contact || 'N/A'}
                        </MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Manufactured Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={newProduct.manufacturedDate}
                  onChange={(e) => setNewProduct({...newProduct, manufacturedDate: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Expiry Date (Optional)"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={newProduct.expiryDate}
                  onChange={(e) => setNewProduct({...newProduct, expiryDate: e.target.value})}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddDialog(false)} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleAddProduct} color="primary" variant="contained">
              Add Product
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Stock Out Dialog */}
      {openStockoutDialog && (
        <Dialog open={true} onClose={() => setOpenStockoutDialog(null)}>
          <DialogTitle>Record Stock Out</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              How many units of this product are being removed from inventory?
            </Typography>
            <TextField
              label="Quantity"
              type="number"
              fullWidth
              value={stockoutData.quantity}
              onChange={(e) => setStockoutData({ quantity: Number(e.target.value) })}
              inputProps={{ min: 1 }}
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenStockoutDialog(null)} color="secondary">
              Cancel
            </Button>
            <Button 
              onClick={() => handleStockout(openStockoutDialog)} 
              color="primary" 
              variant="contained"
            >
              Confirm Stock Out
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Mark Obsolete Dialog */}
      {openObsoleteDialog && (
        <Dialog open={true} onClose={() => setOpenObsoleteDialog(null)}>
          <DialogTitle>Mark Product as Obsolete</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Are you sure you want to mark this product as obsolete? This action cannot be undone.
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This will remove the product from active inventory and move it to the obsolete products section.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenObsoleteDialog(null)} color="secondary">
              Cancel
            </Button>
            <Button 
              onClick={() => handleMarkObsolete(openObsoleteDialog)} 
              color="error" 
              variant="contained"
            >
              Mark as Obsolete
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}