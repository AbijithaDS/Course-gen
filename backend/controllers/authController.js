const db = require('../data/db');

exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password and role are required' });
    }

    if (role !== 'Faculty' && role !== 'Admin') {
      return res.status(400).json({ error: 'Role must be either Faculty or Admin' });
    }

    const users = db.readData('users');
    
    // Check if user already exists
    const userExists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const newUser = {
      username,
      password: db.hashPassword(password),
      role
    };

    users.push(newUser);
    db.writeData('users', users);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        username: newUser.username,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = db.readData('users');
    const hashedPassword = db.hashPassword(password);

    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === hashedPassword);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};
