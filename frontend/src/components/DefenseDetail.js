import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import './DefenseDetail.css';

const DefenseDetail = ({ defense }) => {
  const [defenseDetails, setDefenseDetails] = useState(null);

  useEffect(() => {
    const fetchDefenseDetails = async () => {
      try {
        const response = await axiosInstance.get(`/defense/defenses/${defense.id}`);
        setDefenseDetails(response.data);
      } catch (error) {
        console.error("Error fetching defense details: ", error);
      }
    };

    fetchDefenseDetails();
  }, [defense]);

  const handleUpgrade = async () => {
    try {
      await axiosInstance.post(`/defense/defenses/${defense.id}/upgrade`);
      const response = await axiosInstance.get(`/defense/defenses/${defense.id}`);
      setDefenseDetails(response.data);
    } catch (error) {
      console.error("Error upgrading defense: ", error);
    }
  };

  const handleDestroy = async () => {
    try {
      await axiosInstance.post(`/defense/defenses/${defense.id}/destroy`);
    } catch (error) {
      console.error("Error destroying defense: ", error);
    }
  };

  if (!defenseDetails) return <p>Loading...</p>;

  return (
    <div className="defense-detail">
      <h2>{defenseDetails.name}</h2>
      <p>{defenseDetails.description}</p>
      <p>Quantity: {defenseDetails.quantity}</p>
      <p>Cost: {defenseDetails.cost}</p>
      <button onClick={handleUpgrade}>Upgrade</button>
      <button onClick={handleDestroy}>Destroy</button>
    </div>
  );
};

export default DefenseDetail;
