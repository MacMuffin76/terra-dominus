import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import './ResearchDetail.css';

const ResearchDetail = ({ research }) => {
  const [researchDetails, setResearchDetails] = useState(null);

  useEffect(() => {
    const fetchResearchDetails = async () => {
      try {
        const response = await axiosInstance.get(`/research/research-items/${research.id}`);
        setResearchDetails(response.data);
      } catch (error) {
        console.error("Error fetching research details: ", error);
      }
    };

    fetchResearchDetails();
  }, [research]);

  const handleUpgrade = async () => {
    try {
      await axiosInstance.post(`/research/research-items/${research.id}/upgrade`);
      const response = await axiosInstance.get(`/research/research-items/${research.id}`);
      setResearchDetails(response.data);
    } catch (error) {
      console.error("Error upgrading research: ", error);
    }
  };

  const handleDestroy = async () => {
    try {
      await axiosInstance.post(`/research/research-items/${research.id}/destroy`);
    } catch (error) {
      console.error("Error destroying research: ", error);
    }
  };

  if (!researchDetails) return <p>Loading...</p>;

  return (
    <div className="research-detail">
      <h2>{researchDetails.name}</h2>
      <p>{researchDetails.description}</p>
      <p>Current Level: {researchDetails.level}</p>
      <p>Next Level Cost: {researchDetails.nextLevelCost}</p>
      <button onClick={handleUpgrade}>Upgrade</button>
      <button onClick={handleDestroy}>Destroy</button>
    </div>
  );
};

export default ResearchDetail;
