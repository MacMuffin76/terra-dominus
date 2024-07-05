// backend/testUpdateResources.js
const updateResourcesForUser = require('./updateResources');

const userId = 2; // Remplacez par l'ID utilisateur que vous souhaitez tester

updateResourcesForUser(userId)
    .then(() => {
        console.log('Test completed successfully');
    })
    .catch((err) => {
        console.error('Test failed:', err);
    });
