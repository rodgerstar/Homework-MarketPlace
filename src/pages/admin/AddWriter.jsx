import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { red, green } from '@mui/material/colors';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AddWriter = () => {
  const { token, userRole } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || userRole !== 'admin') {
      navigate('/login');
    }
  }, [token, userRole, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/superadmin/add-writer',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess(response.data.message);
      setFormData({ email: '', name: '', password: '' });
      toast.success('Writer added successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to add writer';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: '#F7F9FC',
        minHeight: '100vh',
        width: '100%',
        p: 4,
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Card
        sx={{
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          bgcolor: 'white',
          width: '100%',
          maxWidth: 500,
        }}
      >
        <CardContent>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1F2A44' }}>
            Add New Writer
          </Typography>

          {error && (
            <Typography variant="body2" sx={{ color: red[500], mb: 2 }}>
              {error}
            </Typography>
          )}
          {success && (
            <Typography variant="body2" sx={{ color: green[500], mb: 2 }}>
              {success}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 3 }}
            />
            <TextField
              label="Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 3 }}
            />
            <TextField
              label="Temporary Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                bgcolor: green[500],
                color: 'white',
                py: 1.5,
                '&:hover': { bgcolor: green[700] },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Add Writer'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddWriter;