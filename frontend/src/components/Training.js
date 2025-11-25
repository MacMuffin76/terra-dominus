// frontend/src/components/Training.js

import React, { useCallback, useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Training.css';
import ResourcesWidget from './ResourcesWidget';
import TrainingDetail from './TrainingDetail';
import { Alert, Loader, Skeleton } from './ui';

const Training = () => {
  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Chargement des centres d’entraînement du joueur
  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.get(
        '/training/training-centers'
      );
      setTrainings(data);
    } catch (err) {
      console.error('Error fetching training centers:', err);
      setError(
        "Erreur lors du chargement des centres d'entraînement"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

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
  const formatFileName = (name) =>
    (name || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // supprime les accents
      .replace(/['’]/g, '') // supprime les apostrophes
      .replace(/\s+/g, '_'); // espaces → underscore

  return (
    <div className="training-container">
      <Menu />
      <ResourcesWidget />
      <div
        className={`training-content ${
          selectedTraining ? 'with-details' : ''
        }`}
        id="main-content"
      >
        <h1>Centres d&apos;entraînement</h1>

        {loading && <Loader label="Chargement des centres" />}
        {error && (
          <Alert
            type="error"
            title="Centres d'entraînement"
            message={error}
            onAction={fetchTrainings}
          />
        )}

        {selectedTraining && (
          <TrainingDetail
            training={selectedTraining}
            onTrainingUpdated={handleTrainingUpdated}
          />
        )}

        <div className="training-list">
          {(loading ? Array.from({ length: 4 }) : trainings).map((training, idx) => (
            <div
              key={training?.id || `training-skeleton-${idx}`}
              className="training-card"
              onClick={() => training && handleTrainingClick(training)}
            >
              {loading ? (
                <Skeleton width="100%" height="180px" />
              ) : (
                <img
                  src={`/images/training/${formatFileName(training.name)}.png`}
                  alt={training.name}
                  className="training-image"
                />
              )}
              <h3>{loading ? <Skeleton width="65%" /> : training.name}</h3>
              <p>{loading ? <Skeleton width="45%" /> : `Niveau : ${training.level ?? 0}`}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Training;