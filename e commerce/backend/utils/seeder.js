import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';

// Sample data
const products = [
  {
    name: 'Wireless Headphones',
    price: 89.99,
    imageUrl: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    description: 'Premium wireless headphones with noise cancellation and 30-hour battery life.',
    stock: 25,
    category: 'Electronics'
  },
  {
    name: 'Smart Watch',
    price: 199.99,
    imageUrl: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    description: 'Fitness tracker with heart rate monitor, GPS, and water resistance.',
    stock: 15,
    category: 'Electronics'
  },
  {
    name: 'Leather Wallet',
    price: 49.99,
    imageUrl: 'https://images.pexels.com/photos/2079438/pexels-photo-2079438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    description: 'Genuine leather wallet with RFID protection and multiple card slots.',
    stock: 30,
    category: 'Accessories'
  },
  {
    name: 'Cotton T-Shirt',
    price: 24.99,
    imageUrl: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    description: '100% organic cotton t-shirt, comfortable and eco-friendly.',
    stock: 50,
    category: 'Clothing'
  },
  {
    name: 'Stainless Steel Water Bottle',
    price: 29.99,
    imageUrl: 'https://images.pexels.com/photos/1188649/pexels-photo-1188649.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    description: 'Double-walled insulated bottle that keeps drinks cold for 24 hours or hot for 12 hours.',
    stock: 40,
    category: 'Home'
  },
  {
    name: 'Backpack',
    price: 79.99,
    imageUrl: 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    description: 'Durable backpack with laptop compartment and multiple pockets.',
    stock: 20,
    category: 'Accessories'
  }
];

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'john123',
    role: 'customer'
  }
];

// Config
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.error(err));

// Import data
const importData = async () => {
  try {
    // Clear existing data
    await Product.deleteMany();
    await User.deleteMany();

    // Insert new data
    await User.insertMany(users);
    await Product.insertMany(products);

    console.log('Data imported successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Delete all data
const destroyData = async () => {
  try {
    await Product.deleteMany();
    await User.deleteMany();

    console.log('Data destroyed successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run script based on command line argument
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}