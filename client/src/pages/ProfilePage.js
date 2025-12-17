import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  Alert,
  Box,
  CircularProgress
} from '@mui/material';
import { Person as PersonIcon, Lock as LockIcon } from '@mui/icons-material';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setLoading(false);
    }
  }, [user]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      setPasswordError('');
      setPasswordSuccess('');
      setPasswordLoading(true);
      
      await api.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordSuccess('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading profile...
        </Typography>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Profile data not available. Please log in again.
        </Alert>
        <Button 
          variant="contained" 
          color="primary"
          onClick={logout}
        >
          Return to Login
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        <PersonIcon fontSize="large" sx={{ mr: 1, verticalAlign: 'middle' }} />
        Profile
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Account Information
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Full Name:</strong> {profile.fullName}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Email:</strong> {profile.email}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Role:</strong> {profile.role === 'admin' ? 'Administrator' : 'Staff Member'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <LockIcon fontSize="medium" color="primary" sx={{ mr: 1 }} />
            <Typography variant="h5">
              Change Password
            </Typography>
          </Box>
          
          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {passwordSuccess}
            </Alert>
          )}
          
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          
          <form onSubmit={handleChangePassword}>
            <TextField
              label="Current Password"
              type="password"
              fullWidth
              margin="normal"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              required
            />
            
            <TextField
              label="New Password"
              type="password"
              fullWidth
              margin="normal"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              required
              helperText="Minimum 6 characters"
            />
            
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              margin="normal"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              required
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3, py: 1.5 }}
              disabled={passwordLoading}
            >
              {passwordLoading ? <CircularProgress size={24} /> : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}