// src/components/WebSocketComponent.js
import React, { useEffect, useState } from 'react';

const WebSocketComponent = () => {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000');

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      ws.send('Hello Server!');
    };
    
    ws.onmessage = (event) => {
      const message = event.data;
      setMessages((prevMessages) => [...prevMessages, message]);
    };
    
    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      ws.close();
    };
  }, []);
  
  return (
    <div>
      <h2></h2>
      <ul>
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    </div>
  );
};

export default WebSocketComponent;
