// frontend/src/components/Training.js

import React, { useCallback, useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import { useAsyncError } from '../hooks/useAsyncError';
import { logger } from '../utils/logger';
import './Training.css';
import ResourcesWidget from './ResourcesWidget';
import TrainingDetail from './TrainingDetail';
import TrainingCard from './training/TrainingCard';
import { Alert, Loader, Modal } from './ui';

const Training = () => {
  const { error, catchError } = useAsyncError('Training');
  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [loading, setLoading] = useState(false);

  // Chargement des centres d'entraînement du joueur
  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(
        '/training/training-centers'
      );
      setTrainings(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      await catchError(async () => { throw err; }, { 
        toast: true, 
        logError: true 
      }).catch(() => {});
    }
  };

  useEffect(() => {
    fetchTrainings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sélection / désélection d’un centre d’entraînement
  const handleTrainingClick = (training) => {
    if (selectedTraining && selectedTraining.id === training.id) {
      setSelectedTraining(null);
    } else {
      setSelectedTraining(training);
    }
  };

  // Callback appelé par TrainingDetail après upgrade / destruction
  const handleTrainingUpdated = (updatedTraining) => {
    // Cas suppression : on retire l’entrée et on ferme le panneau de détail
    if (!updatedTraining && selectedTraining) {
      setTrainings((prev) =>
        prev.filter((t) => t.id !== selectedTraining.id)
      );
      setSelectedTraining(null);
      return;
    }

    // Cas mise à jour : on met à jour la liste et la sélection
    if (updatedTraining) {
      setTrainings((prev) =>
        prev.map((t) =>
          t.id === updatedTraining.id ? { ...t, ...updatedTraining } : t
        )
      );
      setSelectedTraining(updatedTraining);
    }
  };

  // Génère le nom de fichier image à partir du nom
  return (
    <div className="training-container">
      <Menu />
      <div
        className={`training-content ${
          selectedTraining ? 'with-details' : ''
        }`}
        id="main-content"
      >
        <ResourcesWidget />
        <div className="training-header">
          <h1 className="training-title">Centres d&apos;entraînement</h1>
        </div>

        {loading && <Loader label="Chargement des centres" />}
        {error && (
          <Alert
            type="error"
            title="Centres d'entraînement"
            message={error}
            onAction={fetchTrainings}
          />
        )}

        <div className="training-grid">
          {(loading ? Array.from({ length: 4 }) : trainings).map((training, idx) => (
            <TrainingCard
              key={training?.id || `training-skeleton-${idx}`}
              training={training}
              isSelected={selectedTraining?.id === training?.id}
              onClick={() => training && handleTrainingClick(training)}
              loading={loading}
            />
          ))}
        </div>
      </div>

      <Modal
        isOpen={!!selectedTraining}
        onClose={() => setSelectedTraining(null)}
        title="Détails du centre d'entraînement"
      >
        {selectedTraining && (
          <TrainingDetail
            training={selectedTraining}
            onTrainingUpdated={handleTrainingUpdated}
            onClose={() => setSelectedTraining(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Training;