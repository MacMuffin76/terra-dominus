import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import './FacilityDetail.css';

const FacilityDetail = ({ facility }) => {
  const [facilityDetails, setFacilityDetails] = useState(null);

  useEffect(() => {
    const fetchFacilityDetails = async () => {
      try {
        const response = await axiosInstance.get(`/facilities/facility-buildings/${facility.id}`);
        setFacilityDetails(response.data);
      } catch (error) {
        console.error("Error fetching facility details: ", error);
      }
    };

    fetchFacilityDetails();
  }, [facility]);

  const handleUpgrade = async () => {
    try {
      await axiosInstance.post(`/facilities/facility-buildings/${facility.id}/upgrade`);
      // Refresh the facility details after upgrade
      const response = await axiosInstance.get(`/facilities/facility-buildings/${facility.id}`);
      setFacilityDetails(response.data);
    } catch (error) {
      console.error("Error upgrading facility: ", error);
    }
  };

  const handleDestroy = async () => {
    try {
      await axiosInstance.post(`/facilities/facility-buildings/${facility.id}/destroy`);
      // Handle post-destroy actions, e.g., remove the facility from the list
    } catch (error) {
      console.error("Error destroying facility: ", error);
    }
  };

  if (!facilityDetails) return <p>Loading...</p>;

  return (
    <div className="facility-detail">
      <h2>{facilityDetails.name}</h2>
      <p>{facilityDetails.description}</p>
      <p>Current Level: {facilityDetails.level}</p>
      <p>Next Level Cost: {facilityDetails.nextLevelCost}</p>
      <button onClick={handleUpgrade}>Upgrade</button>
      <button onClick={handleDestroy}>Destroy</button>
    </div>
  );
};

export default FacilityDetail;
