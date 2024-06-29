import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Resources from './components/Resources';
import Facilities from './components/Facilities';
import Research from './components/Research';
import Construction from './components/Construction';
import Defense from './components/Defense';
import Fleet from './components/Fleet';
import Alliance from './components/Alliance';
import Login from './components/Login';
import Register from './components/Register';
import WebSocketComponent from './components/WebSocketComponent';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/facilities" element={<Facilities />} />
          <Route path="/research" element={<Research />} />
          <Route path="/construction" element={<Construction />} />
          <Route path="/defense" element={<Defense />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/alliance" element={<Alliance />} />
          <Route path="/websocket" element={<WebSocketComponent />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
