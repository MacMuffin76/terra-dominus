// frontend/src/App.js

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchResources } from './redux/resourceSlice';
import { loginSuccess } from './redux/authSlice';
import axiosInstance from './utils/axiosInstance';
import Dashboard from './components/Dashboard';
import Resources from './components/Resources';
import Facilities from './components/Facilities';
import Research from './components/Research';
import Training from './components/Training';
import Defense from './components/Defense';
import Fleet from './components/Fleet';
import Alliance from './components/Alliance';
import Login from './components/Login';
import Register from './components/Register';
import WebSocketComponent from './components/WebSocketComponent';
import { ResourcesProvider } from './context/ResourcesContext'; // <-- Ajouté ici
import './App.css';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      dispatch(fetchResources(userId));

      axiosInstance.get(`/api/auth/user/${userId}`).then(response => {
        dispatch(loginSuccess(response.data.user));
      }).catch(error => {
        console.error('Failed to fetch user data:', error);
      });
    }
  }, [dispatch]);

  return (
<ResourcesProvider>
  <Router>
    <div className="App">
      <WebSocketComponent />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/facilities" element={<Facilities />} />
        <Route path="/research" element={<Research />} />
        <Route path="/training" element={<Training />} />
        <Route path="/defense" element={<Defense />} />
        <Route path="/fleet" element={<Fleet />} />
        <Route path="/alliance" element={<Alliance />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </div>
  </Router>
</ResourcesProvider>

  );
}

export default App;
