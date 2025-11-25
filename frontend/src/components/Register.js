import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import { Button, Card, Input } from './ui';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const { username, email, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    dispatch(registerUser({ username, email, password }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="auth-page full-height-center">
      <Card className="auth-card" title="Register">
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
            type="email"
            name="email"
            label="Email"
            value={email}
            onChange={onChange}
            placeholder="Email"
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
            Register
          </Button>
          {error && <p className="error-text">{error.message}</p>}
        </form>
        <p className="helper-text text-center">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </Card>
    </div>
  );
};

export default Register;