const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Report = require('./models/Report');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
    
    // Drop indexes safely
    try {
        await User.collection.dropIndexes();
        console.log('Indexes dropped');
    } catch (e) {
        console.log('No indexes to drop or index drop failed', e.message);
    }

    // Clear existing data
    await User.deleteMany({});
    await Report.deleteMany({});

    // Create Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();
    console.log('Admin User Created: admin@example.com / admin123');

    // Create Field Work User
    const fieldPassword = await bcrypt.hash('field123', salt);
    const fieldUser = new User({
        name: 'Field Work User',
        email: 'field@example.com',
        password: fieldPassword,
        role: 'field_work'
    });
    await fieldUser.save();
    console.log('Field Work User Created: field@example.com / field123');

    // Create Sample Report
    const sampleReport = new Report({
        title: 'Road Damage at Main St',
        description: 'Severe potholes observed near the junction.',
        location: { latitude: 18.5204, longitude: 73.8567, address: 'Pune, India' },
        reporterId: fieldUser._id,
        status: 'pending'
    });
    await sampleReport.save();
    console.log('Sample Report Created');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
