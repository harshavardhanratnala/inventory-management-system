import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Container, 
  TextField, 
  Button, 
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Box sx={{ 
        p: 4, 
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        boxShadow: 3,
        width: '100%',
        maxWidth: 400
      }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Inventory Pro
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Sign In
        </Typography>
        
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Welcome back! Please enter your credentials
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Work Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoFocus
          />
          
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ mt: 3, py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </form>
      </Box>
    </Container>
  );
}