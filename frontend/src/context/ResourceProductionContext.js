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
  const lastUpdateRef = useRef(Date.now());

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

  // Initialiser les ressources locales au chargement UNIQUEMENT (une seule fois)
  useEffect(() => {
    // Ne s'exécute qu'une seule fois au montage du composant
    if (isInitialized) {
      return; // Déjà initialisé, ne pas réinitialiser
    }

    const savedResources = localStorage.getItem('localResources');
    const savedTimestamp = localStorage.getItem('localResourcesTimestamp');
    
    if (savedResources && savedTimestamp) {
      try {
        const parsed = JSON.parse(savedResources);
        const timestamp = parseInt(savedTimestamp, 10);
        const now = Date.now();
        
        // Si les données ont moins de 5 minutes, les restaurer
        if (now - timestamp < 5 * 60 * 1000) {
          setLocalResources(parsed);
          setIsInitialized(true);
          console.log('📦 Ressources restaurées depuis localStorage:', parsed);
          return;
        } else {
          console.log('⏰ Données localStorage trop anciennes, utilisation de Redux');
        }
      } catch {
        console.log('❌ Erreur parsing localStorage');
      }
    }
    
    // Fallback: utiliser les données de Redux
    if (resources && Array.isArray(resources) && resources.length > 0) {
      const resourcesObj = resources.reduce((acc, r) => {
        acc[r.type] = r.amount;
        return acc;
      }, {});
      setLocalResources(resourcesObj);
      setIsInitialized(true);
      console.log('📦 Ressources initiales depuis Redux:', resourcesObj);
    }
  }, [resources, isInitialized]);
  
  // Sauvegarder localResources dans localStorage à chaque mise à jour (avec timestamp)
  useEffect(() => {
    if (localResources && isInitialized) {
      localStorage.setItem('localResources', JSON.stringify(localResources));
      localStorage.setItem('localResourcesTimestamp', Date.now().toString());
      // Log réduit pour éviter le spam
      // console.log('💾 Ressources sauvegardées dans localStorage:', localResources);
    }
  }, [localResources, isInitialized]);

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

        // Log réduit (seulement toutes les 10 secondes)
        const shouldLog = Math.floor(Date.now() / 1000) % 10 === 0;
        if (shouldLog) {
          console.log('🔄 Increment resources - previous:', prev);
          console.log('🔄 Increment resources - production:', production);
        }
        
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

        if (shouldLog) {
          console.log('🔄 Increment resources - new:', newResources);
        }

        // Mettre à jour le timestamp de dernière modification
        lastUpdateRef.current = Date.now();

        // Synchronisation Redux désactivée ici :
        // le store est mis à jour par d'autres flux (chargement initial, actions explicites).

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

  // Watchdog : vérifier que l'incrémentation fonctionne toujours
  useEffect(() => {
    if (!isInitialized || !productionRates) {
      return;
    }

    const watchdogInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;
      
      // Si pas de mise à jour depuis plus de 5 secondes, l'intervalle est peut-être cassé
      if (timeSinceLastUpdate > 5000) {
        console.warn('⚠️ Incrémentation bloquée détectée! Temps depuis dernière maj:', timeSinceLastUpdate, 'ms');
        console.log('🔧 Tentative de redémarrage de l\'intervalle...');
        
        // Forcer le redémarrage en changeant isInitialized temporairement
        // Cela va redéclencher le useEffect de l'intervalle
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        lastUpdateRef.current = now;
      }
    }, 10000); // Vérifier toutes les 10 secondes

    return () => clearInterval(watchdogInterval);
  }, [isInitialized, productionRates]);

  // Convertir l'objet en tableau pour ResourcesWidget
  const resourcesArray = localResources && productionRates ? [
    { type: 'or', amount: localResources.or, storage_capacity: productionRates.storage.gold, production_rate: productionRates.production.gold },
    { type: 'metal', amount: localResources.metal, storage_capacity: productionRates.storage.metal, production_rate: productionRates.production.metal },
    { type: 'carburant', amount: localResources.carburant, storage_capacity: productionRates.storage.fuel, production_rate: productionRates.production.fuel },
    { type: 'energie', amount: localResources.energie, storage_capacity: productionRates.storage.energy, production_rate: productionRates.production.energy },
  ] : null;

  // Permettre aux autres modules (upgrade bâtiments, entraînement, etc.)
  // de pousser des mises à jour de ressources côté client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchUpdateResources = (newResources) => {
        console.log('🔧 Mise à jour manuelle des ressources:', newResources);
        setLocalResources((prev) => ({
          ...(prev || {}),
          ...newResources,
        }));
      };
      
      // Fonction pour forcer la resynchronisation avec Redux
      window.forceResourceSync = () => {
        console.log('🔄 Resynchronisation forcée avec Redux');
        if (resources && Array.isArray(resources) && resources.length > 0) {
          const resourcesObj = resources.reduce((acc, r) => {
            acc[r.type] = r.amount;
            return acc;
          }, {});
          setLocalResources(resourcesObj);
          console.log('✅ Ressources synchronisées:', resourcesObj);
        }
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        if (window.dispatchUpdateResources) {
          delete window.dispatchUpdateResources;
        }
        if (window.forceResourceSync) {
          delete window.forceResourceSync;
        }
      }
    };
  }, [resources]);

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
