import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../redux/dashboardSlice';
import axiosInstance from '../utils/axiosInstance';

/**
 * Hook personnalisé pour gérer la production de ressources en temps réel
 * Met à jour les ressources chaque seconde en fonction des taux de production
 */
const useResourceProduction = () => {
  const dispatch = useDispatch();
  const { resources } = useSelector((state) => state.resources);
  
  const [productionRates, setProductionRates] = useState(null);
  const [localResources, setLocalResources] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const intervalRef = useRef(null);

  // Récupérer les taux de production au montage
  useEffect(() => {
    const fetchProductionRates = async () => {
      try {
        const response = await axiosInstance.get('/production/rates');
        if (response.data.success) {
          setProductionRates(response.data.data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des taux de production:', error);
      }
    };

    fetchProductionRates();
    
    // Rafraîchir les taux toutes les 5 minutes (au cas où des bâtiments changent)
    const interval = setInterval(fetchProductionRates, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Initialiser les ressources locales une seule fois au chargement
  useEffect(() => {
    if (resources && Array.isArray(resources) && resources.length > 0 && !isInitialized) {
      // Convertir le tableau en objet
      const resourcesObj = resources.reduce((acc, r) => {
        acc[r.type] = r.amount;
        return acc;
      }, {});
      setLocalResources(resourcesObj);
      setIsInitialized(true);
      console.log('📦 Ressources initiales:', resourcesObj);
    }
  }, [resources, isInitialized]);

  // Incrémenter les ressources chaque seconde (démarrage unique)
  useEffect(() => {
    if (!productionRates || !isInitialized) {
      return;
    }

    // Ne démarrer qu'une seule fois
    if (intervalRef.current) {
      return;
    }

    console.log('🚀 Démarrage incrémentation avec taux:', productionRates.production);

    intervalRef.current = setInterval(() => {
      setLocalResources((prev) => {
        if (!prev) return prev;
        
        const { production, storage } = productionRates;
        
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

        return newResources;
      });
    }, 1000);

    return () => {
      console.log('🛑 Nettoyage intervalle au démontage');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [productionRates, isInitialized]);

  // Fonction pour forcer un refresh complet depuis le serveur
  const refreshResources = async () => {
    await dispatch(fetchDashboardData());
  };

  // Convertir l'objet en tableau pour ResourcesWidget
  const resourcesArray = localResources ? [
    { type: 'or', amount: localResources.or, storage_capacity: productionRates?.storage?.gold || 0, production_rate: productionRates?.production?.gold || 0 },
    { type: 'metal', amount: localResources.metal, storage_capacity: productionRates?.storage?.metal || 0, production_rate: productionRates?.production?.metal || 0 },
    { type: 'carburant', amount: localResources.carburant, storage_capacity: productionRates?.storage?.fuel || 0, production_rate: productionRates?.production?.fuel || 0 },
    { type: 'energie', amount: localResources.energie, storage_capacity: productionRates?.storage?.energy || 0, production_rate: productionRates?.production?.energy || 0 },
  ] : [];

  return {
    resources: resourcesArray,
    productionRates,
    refreshResources,
  };
};

export default useResourceProduction;
