import { useState, useCallback } from 'react';
import { getLogger } from '../utils/logger';

const logger = getLogger('useAsyncError');

/**
 * Options de configuration pour useAsyncError
 * @typedef {Object} AsyncErrorOptions
 * @property {boolean} [toast=false] - Afficher un toast d'erreur
 * @property {boolean} [redirect=false] - Rediriger en cas d'erreur 401/403
 * @property {string} [redirectPath='/login'] - Chemin de redirection
 * @property {Function} [onError] - Callback personnalisé en cas d'erreur
 * @property {boolean} [logError=true] - Logger l'erreur automatiquement
 */

/**
 * Hook React pour gérer les erreurs asynchrones de manière cohérente
 * 
 * Fonctionnalités:
 * - Capture et gère les erreurs des opérations async
 * - Affiche optionnellement des toasts d'erreur
 * - Gère les redirections d'authentification
 * - Log structuré des erreurs
 * - État de loading et d'erreur centralisé
 * 
 * @example
 * function MyComponent() {
 *   const { error, loading, catchError, clearError } = useAsyncError();
 * 
 *   const handleSubmit = async () => {
 *     await catchError(
 *       () => api.submitData(data),
 *       { toast: true, redirect: true }
 *     );
 *   };
 * 
 *   return (
 *     <div>
 *       {loading && <Spinner />}
 *       {error && <Alert message={error} onClose={clearError} />}
 *       <button onClick={handleSubmit}>Submit</button>
 *     </div>
 *   );
 * }
 * 
 * @param {string} [componentName='Component'] - Nom du composant pour les logs
 * @returns {Object} Utilities pour gérer les erreurs async
 */
export function useAsyncError(componentName = 'Component') {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const componentLogger = getLogger(componentName);

  /**
   * Extrait un message d'erreur lisible depuis différents formats d'erreur
   * @param {Error|Object|string} err - Erreur à traiter
   * @returns {string} Message d'erreur formaté
   */
  const extractErrorMessage = useCallback((err) => {
    if (typeof err === 'string') {
      return err;
    }

    if (err?.response?.data?.message) {
      return err.response.data.message;
    }

    if (err?.response?.data?.error) {
      return err.response.data.error;
    }

    if (err?.message) {
      return err.message;
    }

    return 'Une erreur inattendue est survenue';
  }, []);

  /**
   * Gère une redirection basée sur le code d'erreur HTTP
   * @param {Object} err - Erreur contenant potentiellement response.status
   * @param {string} redirectPath - Chemin de redirection
   */
  const handleRedirect = useCallback((err, redirectPath = '/login') => {
    const status = err?.response?.status;
    
    if (status === 401 || status === 403) {
      componentLogger.warn('Authentication error, redirecting', { status });
      
      // Utiliser window.location pour un redirect immédiat
      // Ou utiliser react-router si disponible
      if (window.location.pathname !== redirectPath) {
        window.location.href = redirectPath;
      }
    }
  }, [componentLogger]);

  /**
   * Affiche un toast d'erreur (si disponible)
   * @param {string} message - Message à afficher
   */
  const showToast = useCallback((message) => {
    // TODO: Intégrer avec votre système de toast (react-toastify, etc.)
    // Exemple:
    // if (window.showToast) {
    //   window.showToast({ type: 'error', message });
    // }
    
    // Fallback temporaire
    componentLogger.warn('Toast not implemented, would show:', { message });
  }, [componentLogger]);

  /**
   * Wrapper pour exécuter une fonction async avec gestion d'erreur
   * 
   * @param {Function} asyncFn - Fonction asynchrone à exécuter
   * @param {AsyncErrorOptions} [options={}] - Options de configuration
   * @returns {Promise<*>} Résultat de la fonction async
   * @throws {Error} Re-throw l'erreur après traitement
   */
  const catchError = useCallback(async (asyncFn, options = {}) => {
    const {
      toast = false,
      redirect = false,
      redirectPath = '/login',
      onError = null,
      logError = true
    } = options;

    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      
      // Log l'erreur
      if (logError) {
        componentLogger.error('Async operation failed', err);
      }

      // Mettre à jour l'état d'erreur
      setError(errorMessage);
      setLoading(false);

      // Afficher un toast si demandé
      if (toast) {
        showToast(errorMessage);
      }

      // Gérer la redirection si demandé
      if (redirect) {
        handleRedirect(err, redirectPath);
      }

      // Appeler le callback personnalisé si fourni
      if (onError) {
        onError(err, errorMessage);
      }

      // Re-throw pour permettre un traitement supplémentaire si nécessaire
      throw err;
    }
  }, [extractErrorMessage, handleRedirect, showToast, componentLogger]);

  /**
   * Wrapper pour exécuter une fonction async sans re-throw
   * Utile pour les événements où on ne veut pas propager l'erreur
   * 
   * @param {Function} asyncFn - Fonction asynchrone à exécuter
   * @param {AsyncErrorOptions} [options={}] - Options de configuration
   * @returns {Promise<*|null>} Résultat ou null en cas d'erreur
   */
  const tryCatch = useCallback(async (asyncFn, options = {}) => {
    try {
      return await catchError(asyncFn, options);
    } catch (err) {
      // Erreur déjà loggée et gérée par catchError
      return null;
    }
  }, [catchError]);

  /**
   * Réinitialise l'état d'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Définit manuellement une erreur
   * @param {string|Error} err - Erreur à définir
   */
  const setErrorManual = useCallback((err) => {
    const errorMessage = extractErrorMessage(err);
    setError(errorMessage);
    componentLogger.error('Manual error set', err);
  }, [extractErrorMessage, componentLogger]);

  return {
    error,
    loading,
    catchError,
    tryCatch,
    clearError,
    setError: setErrorManual
  };
}

export default useAsyncError;
