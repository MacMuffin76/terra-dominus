import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../utils/axiosInstance';

const ResourceProductionContext = createContext();

/**
 * Provider global pour la production de ressources en temps réel
 * Gère l'incrémentation automatique des ressources avec catch-up offline
 */
export const ResourceProductionProvider = ({ children }) => {
  const { resources } = useSelector((state) => state.resources);
  const { user } = useSelector((state) => state.auth);
  
  const [productionRates, setProductionRates] = useState(null);
  const [localResources, setLocalResources] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const intervalRef = useRef(null);

  // Récupérer les taux de production au montage
  useEffect(() => {
    // Ne pas appeler l'API si l'utilisateur n'est pas connecté
    if (!user) {
      return;
    }

    const fetchProductionRates = async () => {
      try {
        const response = await axiosInstance.get('/production/rates');
        if (response.data.success) {
          console.log('📊 Taux de production reçus:', response.data.data);

          // Vérifier et normaliser les clés de production et stockage
          const data = response.data.data;

          // Normaliser les clés pour correspondre à la structure attendue
          const normalizedData = {
            production: {
              gold: data.production.gold ?? data.production.or ?? 0,
              metal: data.production.metal ?? 0,
              fuel: data.production.fuel ?? data.production.carburant ?? 0,
              energy: data.production.energy ?? 0,
            },
            storage: {
              gold: data.storage.gold ?? data.storage.or ?? 0,
              metal: data.storage.metal ?? 0,
              fuel: data.storage.fuel ?? data.storage.carburant ?? 0,
              energy: data.storage.energy ?? 0,
            },
          };

          setProductionRates(normalizedData);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des taux de production:', error);
      }
    };

    fetchProductionRates();
    
    // Rafraîchir les taux toutes les 5 minutes (au cas où des bâtiments changent)
    const interval = setInterval(fetchProductionRates, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Initialiser les ressources locales au chargement et restaurer depuis localStorage si possible
  useEffect(() => {
    const savedResources = localStorage.getItem('localResources');
    if (savedResources) {
      try {
        const parsed = JSON.parse(savedResources);
        setLocalResources(parsed);
        setIsInitialized(true);
        console.log('📦 Ressources restaurées depuis localStorage:', parsed);
        return;
      } catch {
        // ignore parse error
      }
    }
    if (resources && Array.isArray(resources) && resources.length > 0) {
      // Convertir le tableau en objet
      const resourcesObj = resources.reduce((acc, r) => {
        acc[r.type] = r.amount;
        return acc;
      }, {});
      setLocalResources(resourcesObj);
      if (!isInitialized) {
        setIsInitialized(true);
        console.log('📦 Ressources initiales (Context):', resourcesObj);
      } else {
        console.log('🔄 Ressources mises à jour (Context):', resourcesObj);
      }
    }
  }, [resources]);
  
  // Sauvegarder localResources dans localStorage à chaque mise à jour
  useEffect(() => {
    if (localResources) {
      localStorage.setItem('localResources', JSON.stringify(localResources));
      console.log('💾 Ressources sauvegardées dans localStorage:', localResources);
    }
  }, [localResources]);

  // Incrémenter les ressources chaque seconde (démarrage unique)
  useEffect(() => {
    if (!productionRates || !isInitialized) {
      return;
    }

    // Toujours nettoyer l'intervalle précédent avant d'en créer un nouveau
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    console.log('🚀 Démarrage incrémentation globale avec taux:', productionRates.production);
    console.log('   - Or (gold):', productionRates.production.gold, '/s');
    console.log('   - Métal (metal):', productionRates.production.metal, '/s');
    console.log('   - Carburant (fuel):', productionRates.production.fuel, '/s');
    console.log('   - Énergie (energy):', productionRates.production.energy, '/s');

    intervalRef.current = setInterval(() => {
      setLocalResources((prev) => {
        if (!prev) return prev;
        
        const { production, storage } = productionRates;

        console.log('🔄 Increment resources - previous:', prev);
        console.log('🔄 Increment resources - production:', production);
        console.log('🔄 Increment resources - storage:', storage);
        
        // Incrémenter de 1 seconde de production
        const newResources = {
          or: Math.min(
            (prev.or || 0) + production.gold,
            storage.gold
          ),
          metal: Math.min(
            (prev.metal || 0) + production.metal,
            storage.metal
          ),
          carburant: Math.min(
            (prev.carburant || 0) + production.fuel,
            storage.fuel
          ),
          energie: Math.min(
            (prev.energie || 0) + production.energy,
            storage.energy
          ),
        };

        console.log('🔄 Increment resources - new:', newResources);

        // Synchroniser localResources avec Redux store toutes les 10 secondes
        if (window.lastSyncTime === undefined) {
          window.lastSyncTime = Date.now();
        }
        const now = Date.now();
        if (now - window.lastSyncTime > 10000) {
          window.lastSyncTime = now;
          // Dispatch action pour mettre à jour Redux store
          // On suppose que dispatch est accessible ici, sinon il faut l'ajouter
          if (window.dispatchUpdateResources) {
            window.dispatchUpdateResources(newResources);
            console.log('🔄 Synchronisation des ressources locales avec Redux store');
          }
        }

        return newResources;
      });
    }, 1000);

    return () => {
      console.log('🛑 Nettoyage intervalle global au démontage');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [productionRates, isInitialized]);

  // Convertir l'objet en tableau pour ResourcesWidget
  const resourcesArray = localResources && productionRates ? [
    { type: 'or', amount: localResources.or, storage_capacity: productionRates.storage.gold, production_rate: productionRates.production.gold },
    { type: 'metal', amount: localResources.metal, storage_capacity: productionRates.storage.metal, production_rate: productionRates.production.metal },
    { type: 'carburant', amount: localResources.carburant, storage_capacity: productionRates.storage.fuel, production_rate: productionRates.production.fuel },
    { type: 'energie', amount: localResources.energie, storage_capacity: productionRates.storage.energy, production_rate: productionRates.production.energy },
  ] : null;

  const value = {
    resources: resourcesArray,
    productionRates,
    isLoading: !resourcesArray || !productionRates,
  };

  return (
    <ResourceProductionContext.Provider value={value}>
      {children}
    </ResourceProductionContext.Provider>
  );
};

/**
 * Hook pour accéder aux ressources avec production en temps réel
 */
export const useResourceProduction = () => {
  const context = useContext(ResourceProductionContext);
  if (!context) {
    throw new Error('useResourceProduction doit être utilisé dans ResourceProductionProvider');
  }
  return context;
};
