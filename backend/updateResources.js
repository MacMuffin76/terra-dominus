require('dotenv').config();
const { Client } = require('pg');

const updateResourcesForUser = async (userId) => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    await client.connect();

    try {
        const query = `CALL update_resources_for_user($1);`;
        await client.query(query, [userId]);
        console.log(`Resources updated successfully for user: ${userId}`);
    } catch (err) {
        console.error('Error updating resources:', err.stack);
    } finally {
        await client.end();
    }
};

module.exports = updateResourcesForUser;
