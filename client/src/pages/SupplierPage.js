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
  TextField,
  Alert,
  Grid,
  IconButton,
  Chip,
  CircularProgress,
  Box
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Inventory as InventoryIcon } from '@mui/icons-material';

export default function SupplierPage() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [newSupplier, setNewSupplier] = useState({
    supplierId: `SUP-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    contact: '',
    address: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [suppliersRes, productsRes] = await Promise.all([
          api.get('/suppliers'),
          api.get('/products')
        ]);
        setSuppliers(suppliersRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        setError('Failed to load suppliers. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  const handleAddSupplier = async () => {
    try {
      await api.post('/suppliers', newSupplier);
      setOpenAddDialog(false);
      setNewSupplier({
        supplierId: `SUP-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        contact: '',
        address: ''
      });
      setError('');
      const suppliersRes = await api.get('/suppliers');
      setSuppliers(suppliersRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding supplier');
    }
  };

  const handleEditSupplier = async () => {
    try {
      await api.put(`/suppliers/${selectedSupplier._id}`, newSupplier);
      setSelectedSupplier(null);
      setOpenAddDialog(false);
      setNewSupplier({
        supplierId: '',
        name: '',
        contact: '',
        address: ''
      });
      setError('');
      const suppliersRes = await api.get('/suppliers');
      setSuppliers(suppliersRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating supplier');
    }
  };

  const handleSupplierClick = (supplier) => {
    setSelectedSupplier(supplier);
    setNewSupplier({
      supplierId: supplier.supplierId,
      name: supplier.name,
      contact: supplier.contact,
      address: supplier.address
    });
    setOpenAddDialog(true);
  };

  const getProductCount = (supplierId) => {
    return products.filter(p => p.supplier?._id === supplierId).length;
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
          Loading suppliers...
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
            Supplier Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {isAdmin 
              ? 'Manage your supplier relationships and product sourcing' 
              : 'View supplier information'}
          </Typography>
        </Grid>
        {isAdmin && (
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => {
                setNewSupplier({
                  supplierId: `SUP-${Math.floor(100 + Math.random() * 900)}`,
                  name: '',
                  contact: '',
                  address: ''
                });
                setSelectedSupplier(null);
                setOpenAddDialog(true);
              }}
            >
              Add Supplier
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
              <TableCell><strong>Supplier ID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Contact</strong></TableCell>
              <TableCell><strong>Address</strong></TableCell>
              <TableCell align="center"><strong>Products</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow 
                key={supplier._id} 
                hover
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  cursor: isAdmin ? 'pointer' : 'default',
                  '&:hover': isAdmin ? { backgroundColor: 'action.hover' } : {}
                }}
                onClick={isAdmin ? () => handleSupplierClick(supplier) : undefined}
              >
                <TableCell>{supplier.supplierId}</TableCell>
                <TableCell>{supplier.name}</TableCell>
                <TableCell>{supplier.contact}</TableCell>
                <TableCell>{supplier.address}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={getProductCount(supplier._id)} 
                    color="primary" 
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {isAdmin && (
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSupplierClick(supplier);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Supplier Dialog - only visible to admins */}
      {isAdmin && (
        <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Supplier ID"
                  fullWidth
                  value={newSupplier.supplierId}
                  InputProps={{ readOnly: true }}
                  sx={{ backgroundColor: 'background.default' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Supplier Name"
                  fullWidth
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Number"
                  fullWidth
                  value={newSupplier.contact}
                  onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
                  required
                  helperText="10-digit phone number"
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Address"
                  fullWidth
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                  required
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddDialog(false)} color="secondary">
              Cancel
            </Button>
            <Button 
              onClick={selectedSupplier ? handleEditSupplier : handleAddSupplier} 
              color="primary" 
              variant="contained"
            >
              {selectedSupplier ? 'Update Supplier' : 'Add Supplier'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}