import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  CircularProgress,
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
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box
} from '@mui/material';
import { Add as AddIcon, Inventory as InventoryIcon, Event as EventIcon } from '@mui/icons-material';
import { format } from 'date-fns';

export default function StockOutPage() {
  const { user } = useAuth();
  const [stockOutRecords, setStockOutRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRecordDialog, setOpenRecordDialog] = useState(false);
  const [newRecord, setNewRecord] = useState({
    product: '',
    quantity: 1,
    timestamp: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [recordsRes, productsRes] = await Promise.all([
          api.get('/stockout'),
          api.get('/products')
        ]);
        setStockOutRecords(recordsRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        setError('Failed to load stock out records');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleRecordStockOut = async () => {
    try {
      await api.put(`/products/${newRecord.product}/stockout`, {
        quantity: newRecord.quantity
      });
      
      await api.post('/stockout', {
        product: newRecord.product,
        quantity: newRecord.quantity,
        timestamp: newRecord.timestamp
      });
      
      setOpenRecordDialog(false);
      setNewRecord({
        product: '',
        quantity: 1,
        timestamp: new Date().toISOString().split('T')[0]
      });
      setError('');
      
      const [recordsRes, productsRes] = await Promise.all([
        api.get('/stockout'),
        api.get('/products')
      ]);
      setStockOutRecords(recordsRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to record stock out');
    }
  };

  // FIXED: Added null checks for product IDs
  const getProductInfo = (productId) => {
    // Handle null or undefined productId
    if (!productId) {
      console.error('getProductInfo called with null productId');
      return { name: 'Unknown Product' };
    }
    
    // Handle cases where productId might be an object with _id property
    const id = typeof productId === 'object' && productId._id ? productId._id : productId;
    
    // Convert to string for comparison
    const idStr = String(id);
    
    // Find product by ID (handle both string and ObjectId formats)
    const product = products.find(p => {
      // Skip null or undefined products
      if (!p || !p._id) return false;
      
      const pIdStr = String(p._id);
      return pIdStr === idStr;
    });
    
    return product || { name: 'Unknown Product' };
  };

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (err) {
      return dateString;
    }
  };

  if (loading) {
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
          Loading stock out records...
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
            Stock Out Records
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Track all inventory removals and stock movements
          </Typography>
        </Grid>
        <Grid item>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => setOpenRecordDialog(true)}
            disabled={user?.role === 'staff' && products.every(p => p.quantity === 0)}
          >
            Record Stock Out
          </Button>
        </Grid>
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
              <TableCell><strong>Date & Time</strong></TableCell>
              <TableCell><strong>Product</strong></TableCell>
              <TableCell align="right"><strong>Quantity</strong></TableCell>
              <TableCell><strong>Recorded By</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockOutRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No stock out records found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              stockOutRecords.map((record) => {
                // Skip records with null product IDs
                if (!record.product) {
                  console.warn('Skipping stock out record with null product ID:', record);
                  return null;
                }
                
                const productInfo = getProductInfo(record.product);
                return (
                  <TableRow 
                    key={record._id} 
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {formatDateTime(record.timestamp)}
                      </Box>
                    </TableCell>
                    <TableCell>{productInfo.name}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`-${record.quantity}`} 
                        color="error" 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>{record.recordedBy?.fullName || 'Unknown'}</TableCell>
                  </TableRow>
                );
              }).filter(Boolean) // Filter out null entries
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Record Stock Out Dialog */}
      <Dialog open={openRecordDialog} onClose={() => setOpenRecordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Stock Out</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Product</InputLabel>
                <Select
                  value={newRecord.product}
                  label="Product"
                  onChange={(e) => setNewRecord({...newRecord, product: e.target.value})}
                >
                  {products.filter(p => p.quantity > 0).map((product) => (
                    <MenuItem key={product._id} value={product._id}>
                      {product.name} (Qty: {product.quantity})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                value={newRecord.quantity}
                onChange={(e) => setNewRecord({...newRecord, quantity: Number(e.target.value)})}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newRecord.timestamp}
                onChange={(e) => setNewRecord({...newRecord, timestamp: e.target.value})}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRecordDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleRecordStockOut} 
            color="primary" 
            variant="contained"
            disabled={!newRecord.product || newRecord.quantity < 1}
          >
            Record Stock Out
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}