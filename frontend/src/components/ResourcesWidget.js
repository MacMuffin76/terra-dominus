import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchResources, updateResources } from '../redux/resourceSlice';
import axios from '../utils/axiosInstance';
import './ResourcesWidget.css';

const ResourcesWidget = () => {
  const dispatch = useDispatch();
  const resources = useSelector(state => state.resources.resources);

  const fetchAndUpdateResources = async () => {
    try {
      const response = await axios.get('/resources/user-resources');
      const userResources = response.data.reduce((acc, resource) => {
        acc[resource.type] = resource.amount;
        return acc;
      }, {});
      dispatch(updateResources(userResources));
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  useEffect(() => {
    fetchAndUpdateResources();
    const interval = setInterval(fetchAndUpdateResources, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="resources-widget">
      <div className="resource-item">
        <img src="/images/resources/or.png" alt="Or" />
        Or: {resources.or}
      </div>
      <div className="resource-item">
        <img src="/images/resources/bois.png" alt="Bois" />
        Bois: {resources.bois}
      </div>
      <div className="resource-item">
        <img src="/images/resources/nourriture.png" alt="Nourriture" />
        Nourriture: {resources.nourriture}
      </div>
      <div className="resource-item">
        <img src="/images/resources/pierre.png" alt="Pierre" />
        Pierre: {resources.pierre}
      </div>
      <div className="resource-item">
        <img src="/images/resources/metal.png" alt="Metal" />
        Metal: {resources.metal}
      </div>
      <div className="resource-item">
        <img src="/images/resources/energie.png" alt="Energie" />
        Energie: {resources.energie}
      </div>
    </div>
  );
};

export default ResourcesWidget;
