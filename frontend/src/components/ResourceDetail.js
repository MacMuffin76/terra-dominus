import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import './ResourceDetail.css';

const ResourceDetail = ({ building }) => {
  const [buildingDetails, setBuildingDetails] = useState(null);

  useEffect(() => {
    const fetchBuildingDetails = async () => {
      try {
        const response = await axiosInstance.get(`/resources/resource-buildings/${building.id}`);
        setBuildingDetails(response.data);
      } catch (error) {
        console.error("Error fetching building details: ", error);
      }
    };

    fetchBuildingDetails();
  }, [building]);

  const handleUpgrade = async () => {
    try {
      await axiosInstance.post(`/resources/resource-buildings/${building.id}/upgrade`);
      // Refresh the building details after upgrade
      const response = await axiosInstance.get(`/resources/resource-buildings/${building.id}`);
      setBuildingDetails(response.data);
    } catch (error) {
      console.error("Error upgrading building: ", error);
    }
  };

  const handleDestroy = async () => {
    try {
      await axiosInstance.post(`/resources/resource-buildings/${building.id}/destroy`);
      // Handle post-destroy actions, e.g., remove the building from the list
    } catch (error) {
      console.error("Error destroying building: ", error);
    }
  };

  if (!buildingDetails) return <p>Loading...</p>;

  return (
    <div className="resource-detail">
      <h2>{buildingDetails.name}</h2>
      <p>{buildingDetails.description}</p>
      <p>Current Level: {buildingDetails.level}</p>
      <p>Next Level Cost: {buildingDetails.nextLevelCost}</p>
      <button onClick={handleUpgrade}>Upgrade</button>
      <button onClick={handleDestroy}>Destroy</button>
    </div>
  );
};

export default ResourceDetail;
