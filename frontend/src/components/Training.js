import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Training.css';
import TrainingDetail from './TrainingDetail';
import ResourcesWidget from './ResourcesWidget';
const Training = () => {
  const [data, setData] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);

  const allowedTrainings = ['Medecin', 'Chasseurs de Devastation', 'Drone', 'Gardiens des Ruines', 'Guerriers des Decombres', 'Mercenaires du Chaos', 'Rangers du Neant'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/training/training-centers');
        const filteredData = response.data.filter(training => allowedTrainings.includes(training.name));
        setData(filteredData);
      } catch (error) {
        console.error('Error fetching training centers:', error);
        setData([]); // Set data to an empty array on error
      }
    };
    fetchData();
  }, []);

  const handleTrainingClick = (training) => {
    if (selectedTraining && selectedTraining.id === training.id) {
      setSelectedTraining(null); // Deselect if already selected
    } else {
      setSelectedTraining(training);
    }
  };

  const formatUnitName = (name) => {
    return name.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remplace les espaces par des underscores et enlève les accents
  };


  return (
    <div className="training-container">
      <Menu />
      <ResourcesWidget />
      <div className={`training-content ${selectedTraining ? 'with-details' : ''}`}>
        <h1>Training Centers</h1>
        {selectedTraining && (
          <TrainingDetail training={selectedTraining} />
        )}
        <div className="training-list">
          {Array.isArray(data) && data.map((training) => (
            <div key={training.id} className="training-card" onClick={() => handleTrainingClick(training)}>
              <img
                src={`/images/training/${formatUnitName(training.name)}.png`}
                alt={training.name}
                className="training-image"
              />
              <h3>{training.name}</h3>
              <p>Nombre: {training.level}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Training;
