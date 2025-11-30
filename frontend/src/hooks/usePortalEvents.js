/**
 * usePortalEvents Hook
 * Gère les événements Socket.IO liés aux portails
 */

import { useEffect } from 'react';
import socket from '../utils/socket';
import { getLogger } from '../utils/logger';

const logger = getLogger('usePortalEvents');

export const usePortalEvents = ({
  onPortalSpawned,
  onPortalExpired,
  onExpeditionResolved
}) => {
  useEffect(() => {
    // Event: New portal spawned
    const handlePortalSpawned = (data) => {
      logger.info('Portal spawned', data);
      onPortalSpawned && onPortalSpawned(data);
    };

    // Event: Portal expired
    const handlePortalExpired = (data) => {
      logger.info('Portal expired', data);
      onPortalExpired && onPortalExpired(data);
    };

    // Event: Expedition resolved
    const handleExpeditionResolved = (data) => {
      logger.info('Expedition resolved', data);
      onExpeditionResolved && onExpeditionResolved(data);
    };

    // Register listeners
    socket.on('portal_spawned', handlePortalSpawned);
    socket.on('portal_expired', handlePortalExpired);
    socket.on('portal_expedition_resolved', handleExpeditionResolved);

    // Cleanup on unmount
    return () => {
      socket.off('portal_spawned', handlePortalSpawned);
      socket.off('portal_expired', handlePortalExpired);
      socket.off('portal_expedition_resolved', handleExpeditionResolved);
    };
  }, [onPortalSpawned, onPortalExpired, onExpeditionResolved]);
};

export default usePortalEvents;
