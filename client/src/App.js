import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import SupplierPage from './pages/SupplierPage';
import StockOutPage from './pages/StockOutPage';
import ObsoletePage from './pages/ObsoletePage';
import ProfilePage from './pages/ProfilePage';
import { 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Menu,
  MenuItem
} from '@mui/material';
import { Inventory as InventoryIcon, Person as PersonIcon } from '@mui/icons-material';

// PrivateRoute component
function PrivateRoute({ children }) {
  const { user, loading, hasVerified } = useAuth();
  
  // Only redirect after we've verified the session
  if (hasVerified && !user) {
    return <Navigate to="/login" replace />;
  }
  
  // Still loading or verifying
  if (loading || !hasVerified) {
    return (
      <Container maxWidth="xl" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h6">Checking authentication...</Typography>
      </Container>
    );
  }
  
  return children;
}

// AuthRedirect component for auth pages
function AuthRedirect({ children }) {
  const { user, loading, hasVerified } = useAuth();
  
  // Only redirect after we've verified the session
  if (hasVerified && user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Still loading or verifying
  if (loading || !hasVerified) {
    return (
      <Container maxWidth="xl" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h6">Checking authentication...</Typography>
      </Container>
    );
  }
  
  return children;
}

// AuthStatus component shows login/logout button
function AuthStatus() {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleClose();
    navigate('/profile');
  };

  if (!user) {
    return (
      <>
        <Button color="inherit" href="/login">
          Login
        </Button>
        <Button color="inherit" href="/register">
          Register
        </Button>
      </>
    );
  }
  
  return (
    <>
      <Button
        color="inherit"
        onClick={handleClick}
        startIcon={<PersonIcon />}
        sx={{ textTransform: 'none' }}
      >
        {user.fullName} ({user.role})
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleProfileClick}>
          Profile
        </MenuItem>
        <MenuItem onClick={logout}>Logout</MenuItem>
      </Menu>
      
      <Box sx={{ ml: 2, display: 'flex', gap: 1 }}>
        <Button color="inherit" onClick={() => navigate('/products')}>
          Products
        </Button>
        <Button color="inherit" onClick={() => navigate('/suppliers')}>
          Suppliers
        </Button>
        <Button color="inherit" onClick={() => navigate('/stockout')}>
          Stock Out
        </Button>
        <Button color="inherit" onClick={() => navigate('/obsolete')}>
          Obsolete
        </Button>
      </Box>
    </>
  );
}

// Main App component
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppBar position="static" color="primary">
          <Container maxWidth="xl">
            <Toolbar disableGutures>
              <Box display="flex" alignItems="center" sx={{ mr: 2 }}>
                <InventoryIcon sx={{ fontSize: 32, mr: 1 }} />
                <Typography
                  variant="h6"
                  noWrap
                  component="a"
                  href="/"
                  sx={{
                    mr: 2,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '.3rem',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  INVENTORY PRO
                </Typography>
              </Box>
              
              <Box sx={{ flexGrow: 1 }} />
              
              <AuthStatus />
            </Toolbar>
          </Container>
        </AppBar>
        
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Routes>
            <Route path="/login" element={
              <AuthRedirect>
                <LoginPage />
              </AuthRedirect>
            } />
            <Route path="/register" element={
              <AuthRedirect>
                <RegisterPage />
              </AuthRedirect>
            } />
            
            <Route path="/" element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            } />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            } />
            <Route path="/products" element={
              <PrivateRoute>
                <ProductPage />
              </PrivateRoute>
            } />
            <Route path="/suppliers" element={
              <PrivateRoute>
                <SupplierPage />
              </PrivateRoute>
            } />
            <Route path="/stockout" element={
              <PrivateRoute>
                <StockOutPage />
              </PrivateRoute>
            } />
            <Route path="/obsolete" element={
              <PrivateRoute>
                <ObsoletePage />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } />
          </Routes>
        </Container>
      </Router>
    </AuthProvider>
  );
}

export default App;