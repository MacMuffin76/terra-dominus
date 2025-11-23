// frontend/src/context/ResourcesContext.js

import React, { createContext, useContext, useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

const ResourcesContext = createContext();

export const ResourcesProvider = ({ children }) => {
  const [resources, setResources] = useState([]);

  // Chargement depuis le backend
  const fetchResourcesFromServer = async () => {
    try {
      const { data } = await axiosInstance.get('/resources/user-resources');

      const normalized = (data || []).map((r) => ({
        ...r,
        amount: Number(r.amount) || 0,
        // level n'est pas stocké sur la ressource côté BDD
        level: Number(r.level) || 0,
      }));

      setResources(normalized);
    } catch (err) {
      console.error('Error fetching resources from server:', err);
    }
  };

  useEffect(() => {
    // 1er chargement
    fetchResourcesFromServer();

    // Refresh périodique (toutes les 3 secondes, par ex.)
    const interval = setInterval(fetchResourcesFromServer, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ResourcesContext.Provider
      value={{
        resources,
        setResources,
        refetchResources: fetchResourcesFromServer,
      }}
    >
      {children}
    </ResourcesContext.Provider>
  );
};

export const useResources = () => useContext(ResourcesContext);
