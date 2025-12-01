import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import { Button, Card, Input } from './ui';
import useAuthForm from '../hooks/useAuthForm';

const Register = () => {
  const navigate = useNavigate();
  const { authState, errors, helperTextFor, getFieldProps, handleSubmit, serverError, status, isBusy } =
    useAuthForm('register');
  const { isAuthenticated } = authState;

  useEffect(() => {
    // Rediriger uniquement après une inscription réussie
    if (status === 'success' && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [status, isAuthenticated, navigate]);

  return (
    <div className="auth-page full-height-center">
      <Card className="auth-card" title="Register">
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
            type="email"
            label="Email"
            placeholder="Email"
            autoComplete="email"
            error={Boolean(errors.email)}
            helperText={helperTextFor('email')}
            {...getFieldProps('email')}
            required
          />
          <Input
            type="password"
            label="Password"
            placeholder="Password"
            autoComplete="new-password"
            error={Boolean(errors.password)}
            helperText={helperTextFor('password')}
            {...getFieldProps('password')}
            required
          />
          <Button variant="primary" type="submit" fullWidth isLoading={isBusy} disabled={isBusy}>
            {status === 'success' ? 'Account created!' : 'Register'}
          </Button>
          {serverError && <p className="error-text">{serverError}</p>}
          {status === 'success' && (
            <p className="success-text">Compte créé ! Redirection en cours…</p>
          )}
        </form>
        <p className="helper-text text-center">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </Card>
    </div>
  );
};

export default Register;