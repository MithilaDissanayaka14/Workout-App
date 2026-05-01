import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './model/user.js';

dotenv.config({ path: './.env' });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existingAdmin = await User.findOne({ email: 'admin@fit.com' });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@fit.com',
            password: hashedPassword,
            isAdmin: true
        });

        await adminUser.save();
        console.log('Admin user seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
