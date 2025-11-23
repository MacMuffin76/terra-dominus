// frontend/src/components/Training.js

import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Training.css';
import ResourcesWidget from './ResourcesWidget';
import TrainingDetail from './TrainingDetail';

const Training = () => {
  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [error, setError] = useState(null);

  // Chargement des centres d’entraînement du joueur
  useEffect(() => {
    const fetchTrainings = async () => {
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
      }
    };

    fetchTrainings();
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
      >
        <h1>Centres d&apos;entraînement</h1>

        {error && <p className="error-message">{error}</p>}

        {selectedTraining && (
          <TrainingDetail
            training={selectedTraining}
            onTrainingUpdated={handleTrainingUpdated}
          />
        )}

        <div className="training-list">
          {trainings.map((training) => (
            <div
              key={training.id}
              className="training-card"
              onClick={() => handleTrainingClick(training)}
            >
              <img
                src={`/images/trainings/${formatFileName(
                  training.name
                )}.png`}
                alt={training.name}
                className="training-image"
              />
              <h3>{training.name}</h3>
              <p>Niveau : {training.level ?? 0}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Training;
