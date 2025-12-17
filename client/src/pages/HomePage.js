import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import api from '../services/api';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Avatar, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Divider,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Inventory as InventoryIcon, 
  People as PeopleIcon, 
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Event as EventIcon,
  Add as AddIcon,
  LocalShipping as LocalShippingIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function HomePage() {
  const { user, authError } = useAuth();
  const { isAdmin, isStaff, loading: roleLoading } = useRole();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (authError) {
      setError('Session expired. Please log in again.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  }, [authError]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) {
      setError('Not authenticated. Please log in.');
      setLoadingData(false);
      return;
    }
    
    try {
      setLoadingData(true);
      setError('');
      
      console.log('🔍 Fetching dashboard data...');
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const [productsRes, suppliersRes, stockOutRes] = await Promise.all([
        api.get('/products', { signal: controller.signal }),
        api.get('/suppliers', { signal: controller.signal }),
        api.get('/stockout', { signal: controller.signal })
      ]);
      
      clearTimeout(timeoutId);
      
      console.log('✅ Data fetch successful', {
        products: productsRes.data.length,
        suppliers: suppliersRes.data.length,
        stockOut: stockOutRes.data.length
      });
      
      // Calculate key metrics
      const totalProducts = productsRes.data.length;
      const totalSuppliers = suppliersRes.data.length;
      const totalStockOut = stockOutRes.data.length;
      
      // Calculate low stock items
      const lowStockItems = productsRes.data.filter(p => p.quantity < 10).length;
      
      // Get soon-to-expire products (within 7 days)
      const soonToExpire = productsRes.data.filter(product => {
        if (!product.expiryDate) return false;
        const expiryDate = new Date(product.expiryDate);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 7;
      });
      
      // Get recent stock outs (last 7 days)
      const recentStockOut = stockOutRes.data
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
        .map(record => ({
          ...record,
          product: productsRes.data.find(p => p._id === record.product)
        }));

      setDashboardData({
        products: productsRes.data,
        totalProducts,
        totalSuppliers,
        totalStockOut,
        lowStockItems,
        soonToExpire,
        recentStockOut
      });
    } catch (err) {
      console.error('❌ Dashboard data fetch error:', {
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
        message: err.message,
        code: err.code
      });
      
      let errorMessage = 'Failed to load dashboard data';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your network connection.';
        setRetryCount(prev => prev + 1);
      } else if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        // Force a redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to view this page';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoadingData(false);
    }
  };

  const formatExpiryDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (err) {
      return dateString;
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    try {
      const expiry = new Date(expiryDate);
      const today = new Date();
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Show loading state while checking role
  if (roleLoading || (user && loadingData)) {
    return (
      <Container maxWidth="xl" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {loadingData ? 'Loading dashboard data...' : 'Checking permissions...'}
        </Typography>
        {retryCount > 0 && (
          <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
            Attempt {retryCount} of 3
          </Typography>
        )}
      </Container>
    );
  }

  // Show error state if we have an error
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
        {retryCount < 3 && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={fetchDashboardData}
          >
            Retry Loading
          </Button>
        )}
      </Container>
    );
  }

  // Show not authenticated state
  if (!user) {
    return (
      <Container maxWidth="xl" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          You need to be logged in to view the dashboard
        </Alert>
        <Button 
          variant="contained" 
          color="primary"
          href="/login"
        >
          Go to Login
        </Button>
      </Container>
    );
  }

  // Show empty state if no data
  if (!dashboardData || dashboardData.totalProducts === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={0} sx={{ 
          borderRadius: 2, 
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          p: 4,
          textAlign: 'center'
        }}>
          <InventoryIcon fontSize="large" color="disabled" sx={{ mb: 2, opacity: 0.3 }} />
          <Typography variant="h5" color="text.secondary">
            No inventory data found
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Get started by adding your first product
          </Typography>
          
          {isAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              href="/products"
              sx={{ 
                px: 3,
                py: 1.5,
                fontWeight: 600
              }}
            >
              Add Your First Product
            </Button>
          )}
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        mb: 3,
        gap: 2
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <InventoryIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
            <Typography variant="h4" component="h1">
              Inventory Dashboard
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            Comprehensive overview of your inventory system
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          flexWrap: 'wrap',
          justifyContent: isMobile ? 'flex-start' : 'flex-end'
        }}>
          {isAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              href="/products"
              sx={{ 
                px: 3,
                py: 1.5,
                fontWeight: 600
              }}
            >
              Add Product
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              href="/suppliers"
              sx={{ 
                px: 3,
                py: 1.5,
                fontWeight: 600
              }}
            >
              Add Supplier
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: 3 
            }
          }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main', 
                  mr: 2,
                  width: 56,
                  height: 56
                }}>
                  <InventoryIcon fontSize="large" />
                </Avatar>
                <div>
                  <Typography variant="h6" color="text.secondary">
                    Total Products
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardData.totalProducts}
                  </Typography>
                </div>
              </Box>
              <Divider />
              <Box mt={2} display="flex" alignItems="center">
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2" color="warning.main">
                  {dashboardData.lowStockItems} low stock items
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: 3 
            }
          }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ 
                  bgcolor: 'success.main', 
                  mr: 2,
                  width: 56,
                  height: 56
                }}>
                  <LocalShippingIcon fontSize="large" />
                </Avatar>
                <div>
                  <Typography variant="h6" color="text.secondary">
                    Suppliers
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardData.totalSuppliers}
                  </Typography>
                </div>
              </Box>
              <Divider />
              <Box mt={2} display="flex" alignItems="center">
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {dashboardData.totalProducts} products sourced
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: 3 
            }
          }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ 
                  bgcolor: 'info.main', 
                  mr: 2,
                  width: 56,
                  height: 56
                }}>
                  <EventIcon fontSize="large" />
                </Avatar>
                <div>
                  <Typography variant="h6" color="text.secondary">
                    Expiring Soon
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardData.soonToExpire.length}
                  </Typography>
                </div>
              </Box>
              <Divider />
              <Box mt={2}>
                <Typography variant="body2" noWrap>
                  {dashboardData.soonToExpire.length > 0 ? 
                    `Next: ${dashboardData.soonToExpire[0].name}` : 
                    'No items expiring soon'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: 3 
            }
          }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ 
                  bgcolor: 'warning.main', 
                  mr: 2,
                  width: 56,
                  height: 56
                }}>
                  <PeopleIcon fontSize="large" />
                </Avatar>
                <div>
                  <Typography variant="h6" color="text.secondary">
                    Recent Activity
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardData.totalStockOut}
                  </Typography>
                </div>
              </Box>
              <Divider />
              <Box mt={2}>
                <Typography variant="body2" noWrap>
                  {
                    dashboardData.recentStockOut.length > 0 ? 
                    `Last: ${dashboardData.recentStockOut[0].product?.name || 'Unknown'}` : 
                    'No recent activity'
                  }
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Inventory Summary */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ 
            borderRadius: 2, 
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              p: 3,
              borderBottom: `1px solid ${theme.palette.divider}`,
              backgroundColor: 'background.default'
            }}>
              <Box display="flex" alignItems="center" mb={2}>
                <InventoryIcon fontSize="medium" color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" component="h2">
                  Inventory Summary
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ p: 3, flexGrow: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                    Low Stock Items
                  </Typography>
                  {dashboardData.lowStockItems > 0 ? (
                    <List sx={{ 
                      maxHeight: isMobile ? '200px' : '300px',
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': { display: 'none' },
                      msOverflowStyle: 'none',
                      scrollbarWidth: 'none'
                    }}>
                      {dashboardData.products
                        .filter(p => p.quantity < 10)
                        .slice(0, 5)
                        .map((product) => (
                          <React.Fragment key={product._id}>
                            <ListItem sx={{ py: 1.5 }}>
                              <ListItemText
                                primary={product.name}
                                primaryTypographyProps={{ 
                                  fontWeight: 500,
                                  noWrap: true,
                                  maxWidth: '70%'
                                }}
                                secondary={
                                  <Box display="flex" alignItems="center" mt={0.5}>
                                    <Chip 
                                      label={`${product.quantity} left`} 
                                      color="warning" 
                                      size="small"
                                      sx={{ mr: 1 }}
                                    />
                                    <span>Reorder needed</span>
                                  </Box>
                                }
                              />
                            </ListItem>
                            <Divider component="li" />
                          </React.Fragment>
                        ))
                      }</List>
                  ) : (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      All inventory items are sufficiently stocked
                    </Alert>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                    Upcoming Expirations
                  </Typography>
                  {dashboardData.soonToExpire.length > 0 ? (
                    <List sx={{ 
                      maxHeight: isMobile ? '200px' : '300px',
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': { display: 'none' },
                      msOverflowStyle: 'none',
                      scrollbarWidth: 'none'
                    }}>
                      {dashboardData.soonToExpire.slice(0, 5).map((product) => {
                        const days = getDaysUntilExpiry(product.expiryDate);
                        return (
                          <React.Fragment key={product._id}>
                            <ListItem sx={{ py: 1.5 }}>
                              <ListItemText
                                primary={product.name}
                                primaryTypographyProps={{ 
                                  fontWeight: 500,
                                  noWrap: true,
                                  maxWidth: '70%'
                                }}
                                secondary={
                                  <Box display="flex" alignItems="center" mt={0.5}>
                                    <Chip 
                                      label={`${days} day${days !== 1 ? 's' : ''} left`} 
                                      color={days <= 3 ? "error" : "warning"} 
                                      size="small"
                                      sx={{ mr: 1 }}
                                    />
                                    <span>Expires: {formatExpiryDate(product.expiryDate)}</span>
                                  </Box>
                                }
                              />
                            </ListItem>
                            <Divider component="li" />
                          </React.Fragment>
                        );
                      })}
                    </List>
                  ) : (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      No products expiring within the next 7 days
                    </Alert>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ 
            borderRadius: 2, 
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              p: 3,
              borderBottom: `1px solid ${theme.palette.divider}`,
              backgroundColor: 'background.default'
            }}>
              <Box display="flex" alignItems="center" mb={2}>
                <EventIcon fontSize="medium" color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" component="h2">
                  Recent Activity
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ p: 3, flexGrow: 1 }}>
              {dashboardData.recentStockOut.length > 0 ? (
                <List sx={{ 
                  maxHeight: isMobile ? '300px' : '400px',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': { display: 'none' },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none'
                }}>
                  {dashboardData.recentStockOut.map((record) => (
                    <React.Fragment key={record._id}>
                      <ListItem sx={{ py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {record.quantity}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={record.product?.name || 'Unknown Product'}
                          primaryTypographyProps={{ 
                            fontWeight: 500,
                            noWrap: true
                          }}
                          secondary={
                            <Box>
                              <Typography component="span" variant="body2">
                                {format(new Date(record.timestamp), 'MMM d, h:mm a')}
                              </Typography>
                              <br />
                              <Typography 
                                component="span" 
                                variant="body2" 
                                color="text.secondary"
                              >
                                Removed from inventory
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  py: 4
                }}>
                  <EventIcon fontSize="large" color="disabled" sx={{ mb: 2, opacity: 0.3 }} />
                  <Typography variant="h6" color="text.secondary" align="center">
                    No recent activity
                  </Typography>
                  <Typography color="text.secondary" align="center" sx={{ mt: 1 }}>
                    Stock removals will appear here
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box sx={{ 
              p: 3, 
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: 'background.default'
            }}>
              <Button 
                variant="contained" 
                fullWidth
                size="medium"
                startIcon={<AddIcon />}
                href="/stockout"
                sx={{ py: 1.5 }}
              >
                Record Stock Out
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}