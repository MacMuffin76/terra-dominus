import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { safeStorage } from '../utils/safeStorage';
import { Button, Card, Input } from './ui';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error, token } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const { username, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    dispatch(login({ username, password }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      safeStorage.setItem('jwtToken', token); // Stocker le token dans localStorage même si localStorage est indisponible
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, token]);

   return (
    <div className="auth-page full-height-center">
      <Card className="auth-card" title="Login">
        <form onSubmit={onSubmit} className="form-grid">
          <Input
            type="text"
            name="username"
            label="Username"
            value={username}
            onChange={onChange}
            placeholder="Username"
            required
          />
          <Input
            type="password"
            name="password"
            label="Password"
            value={password}
            onChange={onChange}
            placeholder="Password"
            required
          />
          <Button variant="primary" type="submit" fullWidth>
            Login
          </Button>
          {error && (
            <p className="error-text">
              {error.message || 'Connexion échouée. Veuillez réessayer.'}
            </p>
          )}
        </form>
        <p className="helper-text text-center">
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </Card>
    </div>
  );
};

export default Login;