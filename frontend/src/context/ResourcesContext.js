// frontend/src/context/ResourcesContext.js

import React, { createContext, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchResources, updateResources } from '../redux/resourceSlice';
import { safeStorage } from '../utils/safeStorage';

const ResourcesContext = createContext();

export const ResourcesProvider = ({ children }) => {
  const dispatch = useDispatch();
  const resources = useSelector((state) => state.resources.resources || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetchResources = async () => {
    const userId = safeStorage.getItem('userId');
    if (!userId) return;

    setLoading(true);
    try {
      await dispatch(fetchResources(userId)).unwrap();
      setError(null);
    } catch (err) {
      setError(err?.message || 'Impossible de rafraîchir les ressources.');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Correction : permettre setResources(prev => ...)
  const setResources = (updater) => {
    if (typeof updater === 'function') {
      // on récupère l'état actuel de Redux
      const current = resources;
      const updated = updater(current);
      dispatch(updateResources(updated));
    } else {
      // cas normal : setResources(array)
      dispatch(updateResources(updater));
    }
  };

  return (
    <ResourcesContext.Provider
      value={{
        resources,
        setResources,
        refetchResources,
        loading,
        error,
      }}
    >
      {children}
    </ResourcesContext.Provider>
  );
};

export const useResources = () => useContext(ResourcesContext);
