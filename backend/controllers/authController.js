const db = require('../data/db');
const config = require('../config');


// Expose Google Client ID dynamically to frontend
exports.getConfig = (req, res) => {
  res.status(200).json({
    success: true,
    googleClientId: process.env.GOOGLE_CLIENT_ID
  });
};

// Handle Google Sign-In verification & account creation
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token is required' });
    }

    console.log('Verifying Google ID Token server-side...');

    // Request Google's public tokeninfo verification endpoint
    const verificationUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    const verifyRes = await fetch(verificationUrl);
    
    if (!verifyRes.ok) {
      const errData = await verifyRes.json();
      console.error('Google ID Token verification failed:', errData);
      return res.status(401).json({ error: 'Invalid Google ID token', details: errData.error_description });
    }

    const payload = await verifyRes.json();

    // 1. Security Check: Validate Audience (aud) matches our Client ID
    const clientAud = payload.aud;
    if (clientAud !== process.env.GOOGLE_CLIENT_ID) {
      console.warn(`Audience mismatch! Expected ${process.env.GOOGLE_CLIENT_ID}, received ${clientAud}`);
      return res.status(403).json({ error: 'Security breach: Client ID audience mismatch' });
    }

    // Extract user profile parameters
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Google account is missing an email address' });
    }

    if (config.SYSTEM_OWNER_EMAIL_HASH && db.hashPassword(email.toLowerCase()) === config.SYSTEM_OWNER_EMAIL_HASH) {
      console.log(`System Owner signed in via Google: ${email}`);
      return res.status(200).json({
        success: true,
        message: 'Google login successful',
        user: {
          username: 'System Owner',
          role: 'SYSTEM_OWNER',
          email: email.toLowerCase(),
          profilePicture: picture || ''
        }
      });
    }

    const users = db.readData('users');
    
    // 2. Database Check: See if email is already registered
    let user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

    if (user) {
      console.log(`Google user signed in: ${email} (${user.role})`);
      
      // Update Google ID and Profile Picture if they are not already set
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        updated = true;
      }
      if (picture && user.profilePicture !== picture) {
        user.profilePicture = picture;
        updated = true;
      }
      
      if (updated) {
        db.writeData('users', users);
      }
    } else {
      console.log(`New Google user detected. Auto-creating Faculty account for ${email}...`);
      
      // Determine unique username prefix from email (e.g. asha.r from asha.r@gmail.com)
      let baseUsername = email.split('@')[0];
      let username = baseUsername;
      
      // Check for username duplication and append suffix if taken
      let counter = 1;
      while (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }

      // Create new user schema
      const newUser = {
        id: 'USR' + Date.now(),
        username: username,
        email: email,
        role: 'Faculty', // Google login is strictly Faculty by default
        authProvider: 'google',
        googleId: googleId,
        profilePicture: picture || '',
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      db.writeData('users', users);
      
      user = newUser;
      console.log(`Successfully generated Faculty profile: ${username}`);
    }

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      user: {
        username: user.username,
        role: user.role,
        email: user.email,
        profilePicture: user.profilePicture || ''
      }
    });

  } catch (error) {
    console.error('Error during Google authentication:', error);
    res.status(500).json({ error: 'Server error during Google authentication', details: error.message });
  }
};

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
      id: 'USR' + Date.now(),
      username,
      password: db.hashPassword(password),
      role,
      authProvider: 'local',
      createdAt: new Date().toISOString()
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

    if (config.SYSTEM_OWNER_EMAIL_HASH && config.SYSTEM_OWNER_PASSWORD_HASH &&
        (db.hashPassword(username.toLowerCase()) === config.SYSTEM_OWNER_EMAIL_HASH || username.toLowerCase() === 'system owner' || username.toLowerCase() === 'system_owner') &&
        db.hashPassword(password) === config.SYSTEM_OWNER_PASSWORD_HASH) {
      console.log(`System Owner logged in locally: ${username}`);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          username: 'System Owner',
          role: 'SYSTEM_OWNER',
          email: 'admin7226@gmail.com',
          profilePicture: ''
        }
      });
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
        role: user.role,
        email: user.email || '',
        profilePicture: user.profilePicture || ''
      }
    });

  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};
