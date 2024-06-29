const User = require('../models/User');
const Building = require('../models/Building');
const Resource = require('../models/Resource');
const Unit = require('../models/Unit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashedPassword });

    // Initial buildings
    const buildings = [
      { name: 'Mine', level: 1, user_id: newUser.id },
      { name: 'Farm', level: 1, user_id: newUser.id },
      { name: 'Barrack', level: 1, user_id: newUser.id },
      { name: 'Defense', level: 1, user_id: newUser.id },
      { name: 'House', level: 1, user_id: newUser.id },
      { name: 'Lab', level: 1, user_id: newUser.id },
      { name: 'Power Plant', level: 1, user_id: newUser.id },
      { name: 'Sawmill', level: 1, user_id: newUser.id },
    ];
    await Building.bulkCreate(buildings);

    // Initial resources
    const resources = [
      { type: 'or', amount: 1000, user_id: newUser.id },
      { type: 'metal', amount: 1000, user_id: newUser.id },
      { type: 'bois', amount: 1000, user_id: newUser.id },
      { type: 'nourriture', amount: 1000, user_id: newUser.id },
      { type: 'pierre', amount: 1000, user_id: newUser.id },
      { type: 'energie', amount: 1000, user_id: newUser.id },
    ];
    await Resource.bulkCreate(resources);

    // Initial units
    const units = [
      { name: 'Infantry', quantity: 10, user_id: newUser.id },
      { name: 'Cavalry', quantity: 10, user_id: newUser.id },
      { name: 'Artillery', quantity: 5, user_id: newUser.id },
      { name: 'Drone', quantity: 5, user_id: newUser.id },
      { name: 'Medic', quantity: 5, user_id: newUser.id },
    ];
    await Unit.bulkCreate(units);

    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: newUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

// Login User
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, user });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Error logging in user' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
