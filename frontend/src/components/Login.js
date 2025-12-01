import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { safeStorage } from '../utils/safeStorage';
import { Button, Card, Input } from './ui';
import useAuthForm from '../hooks/useAuthForm';

const Login = () => {
  const navigate = useNavigate();
  const { authState, errors, helperTextFor, getFieldProps, handleSubmit, serverError, status, isBusy } =
    useAuthForm('login');
  const { isAuthenticated, token } = authState;

  useEffect(() => {
    // Rediriger uniquement après une connexion réussie (status === 'success')
    // et non simplement parce que isAuthenticated est true
    if (status === 'success' && isAuthenticated && token) {
      safeStorage.setItem('jwtToken', token);
      navigate('/dashboard');
    }
  }, [status, isAuthenticated, navigate, token]);

  return (
    <div className="auth-page full-height-center">
      <Card className="auth-card" title="Login">
        <form onSubmit={handleSubmit} className="form-grid">
          <Input
            type="text"
            label="Username"
            placeholder="Username"
            autoComplete="username"
            error={Boolean(errors.username)}
            helperText={helperTextFor('username')}
            {...getFieldProps('username')}
            required
          />
          <Input
            type="password"
            label="Password"
            placeholder="Password"
            autoComplete="current-password"
            error={Boolean(errors.password)}
            helperText={helperTextFor('password')}
            {...getFieldProps('password')}
            required
          />
          <Button variant="primary" type="submit" fullWidth isLoading={isBusy} disabled={isBusy}>
            {status === 'success' ? 'Connecting…' : 'Login'}
          </Button>
          {serverError && (
            <p className="error-text">
              {serverError || 'Connexion échouée. Veuillez réessayer.'}
            </p>
          )}
          {status === 'success' && <p className="success-text">Connexion réussie !</p>}
        </form>
        <p className="helper-text text-center">
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </Card>
    </div>
  );
};

export default Login;