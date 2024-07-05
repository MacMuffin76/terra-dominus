import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import { calculateResourceProduction, calculateEnergyProduction } from '../utils/resourceProduction';
import './Dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/dashboard');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      const interval = setInterval(() => {
        const newResources = data.resources.map((resource) => {
          const level = Number(resource.level) || 1;
          const productionRate = resource.type === 'energie' ? calculateEnergyProduction(level) : calculateResourceProduction(level);
          return {
            ...resource,
            amount: resource.amount + productionRate,
          };
        });
        setData((prevData) => ({
          ...prevData,
          resources: newResources,
        }));
      }, 1000); // Mise à jour toutes les secondes

      return () => clearInterval(interval); // Nettoyage de l'intervalle lors du démontage du composant
    }
  }, [data]);

  if (!data) {
    return <div>Loading...</div>;
  }

  const formatFileName = (name) => {
    return name.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remplace les espaces par des underscores et enlève les accents
  };

  return (
    <div className="dashboard">
      <Menu />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Tableau de bord</h1>
        </div>
        <div className="dashboard-modules">
          <div className="dashboard-module">
            <h2>Informations</h2>
            <p>Pseudo: {data.user.username}</p>
            <p>Level: {data.user.level}</p>
            <p>Points d'experience: {data.user.points_experience}</p>
            <p>Rang: {data.user.rang}</p>
          </div>
          <div className="dashboard-module dashboard-resources">
            <h2>Ressources</h2>
            <ul>
              {data.resources.map((resource) => (
                <li key={resource.id}>
                  <img src={`./images/resources/${formatFileName(resource.type)}.png`} alt={resource.type} className="dashboard-resource-icon" />
                  <span className="dashboard-resource-text">{resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}: {Math.floor(resource.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="dashboard-module dashboard-buildings">
            <h2>Batiments</h2>
            <ul>
              {data.buildings.map((building) => (
                <li key={building.id}>
                  <img src={`./images/buildings/${formatFileName(building.name)}.png`} alt={building.name} className="dashboard-building-icon" />
                  <span className="dashboard-building-text">{building.name.charAt(0).toUpperCase() + building.name.slice(1)} (Level: {building.level})</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="dashboard-module dashboard-units">
            <h2>Unités</h2>
            <ul>
              {data.units.map((unit) => (
                <li key={unit.id}>
                  <img src={`./images/training/${formatFileName(unit.name)}.png`} alt={unit.name} className="dashboard-unit-icon" />
                  <span className="dashboard-unit-text">{unit.name.charAt(0).toUpperCase() + unit.name.slice(1)}: {unit.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
