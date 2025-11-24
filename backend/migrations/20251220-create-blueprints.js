'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('blueprints', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      max_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      base_duration_seconds: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      costs: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('blueprints', ['category']);
    await queryInterface.addIndex('blueprints', ['type']);
    await queryInterface.addConstraint('blueprints', {
      fields: ['category', 'type'],
      type: 'unique',
      name: 'unique_blueprint_category_type',
    });

    await queryInterface.createTable('blueprint_audits', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      blueprint_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'blueprints',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      before: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      after: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    const now = new Date();

    const researchBlueprints = [
      { type: 'Technologie Laser Photonique', costs: { metal: 800, or: 350, carburant: 150 }, base_duration_seconds: 1800, max_level: 20 },
      { type: 'Systèmes d’Armes Railgun', costs: { metal: 950, or: 400, carburant: 150 }, base_duration_seconds: 2100, max_level: 20 },
      { type: 'Déploiement de Champs de Force', costs: { metal: 600, or: 500, carburant: 200, energie: 100 }, base_duration_seconds: 2400, max_level: 18 },
      { type: 'Guidage Avancé de Missiles', costs: { metal: 700, or: 375, carburant: 275 }, base_duration_seconds: 1900, max_level: 20 },
      { type: 'Antigravitationnelle', costs: { metal: 650, or: 450, carburant: 220, energie: 80 }, base_duration_seconds: 2200, max_level: 18 },
      { type: 'Ingénierie des Contre-mesures EM', costs: { metal: 500, or: 325, carburant: 150, energie: 50 }, base_duration_seconds: 1700, max_level: 16 },
      { type: 'Confinement de Plasma', costs: { metal: 1050, or: 525, carburant: 250, energie: 120 }, base_duration_seconds: 2600, max_level: 20 },
      { type: 'Impulsion EM Avancée', costs: { metal: 750, or: 375, carburant: 200, energie: 60 }, base_duration_seconds: 2000, max_level: 18 },
      { type: 'Nanotechnologie Autoréplicante', costs: { metal: 900, or: 475, carburant: 250 }, base_duration_seconds: 2300, max_level: 20 },
      { type: 'Réseau de Détection Quantique', costs: { metal: 650, or: 525, carburant: 180, energie: 140 }, base_duration_seconds: 2100, max_level: 18 },
    ].map((bp) => ({
      ...bp,
      category: 'research',
      created_at: now,
      updated_at: now,
    }));

    const unitBlueprints = [
      { type: 'Drone d’assaut terrestre', costs: { metal: 120, or: 40, carburant: 60 }, base_duration_seconds: 420, max_level: 15 },
      { type: 'Fantassin plasmique', costs: { metal: 140, or: 60, carburant: 50 }, base_duration_seconds: 450, max_level: 15 },
      { type: 'Infiltrateur holo-camouflage', costs: { metal: 160, or: 75, carburant: 80 }, base_duration_seconds: 480, max_level: 15 },
      { type: 'Tireur à antimatière', costs: { metal: 200, or: 95, carburant: 90 }, base_duration_seconds: 520, max_level: 15 },
      { type: 'Artilleur à railgun', costs: { metal: 225, or: 105, carburant: 110 }, base_duration_seconds: 560, max_level: 15 },
      { type: 'Exo-sentinelle', costs: { metal: 260, or: 120, carburant: 130 }, base_duration_seconds: 600, max_level: 15 },
      { type: 'Commandos nano-armure', costs: { metal: 280, or: 150, carburant: 150 }, base_duration_seconds: 650, max_level: 15 },
      { type: 'Légionnaire quantique', costs: { metal: 320, or: 180, carburant: 180 }, base_duration_seconds: 700, max_level: 15 },
    ].map((bp) => ({
      ...bp,
      category: 'unit',
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert('blueprints', [...researchBlueprints, ...unitBlueprints]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('blueprints', null, {});
    await queryInterface.dropTable('blueprint_audits');
    await queryInterface.dropTable('blueprints');
  },
};