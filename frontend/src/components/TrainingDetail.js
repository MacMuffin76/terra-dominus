import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import './TrainingDetail.css';

const TrainingDetail = ({ training }) => {
  const [trainingDetails, setTrainingDetails] = useState(null);

  useEffect(() => {
    const fetchTrainingDetails = async () => {
      try {
        const response = await axiosInstance.get(`/training/training-centers/${training.id}`);
        setTrainingDetails(response.data);
      } catch (error) {
        console.error("Error fetching training details: ", error);
      }
    };

    fetchTrainingDetails();
  }, [training]);

  const handleUpgrade = async () => {
    try {
      await axiosInstance.post(`/training/training-centers/${training.id}/upgrade`);
      // Refresh the training details after upgrade
      const response = await axiosInstance.get(`/training/training-centers/${training.id}`);
      setTrainingDetails(response.data);
    } catch (error) {
      console.error("Error upgrading training: ", error);
    }
  };

  const handleDestroy = async () => {
    try {
      await axiosInstance.post(`/training/training-centers/${training.id}/destroy`);
      // Handle post-destroy actions, e.g., remove the training from the list
    } catch (error) {
      console.error("Error destroying training: ", error);
    }
  };

  if (!trainingDetails) return <p>Loading...</p>;

  return (
    <div className="training-detail">
      <h2>{trainingDetails.name}</h2>
      <p>{trainingDetails.description}</p>
      <p>Current number: {trainingDetails.level}</p>
      <p>Buying cost: {trainingDetails.nextLevelCost}</p>
      <button onClick={handleUpgrade}>Upgrade</button>
      <button onClick={handleDestroy}>Destroy</button>
    </div>
  );
};

export default TrainingDetail;
