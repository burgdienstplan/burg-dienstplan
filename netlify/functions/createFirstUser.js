const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

exports.handler = async function(event, context) {
  let client;
  
  try {
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db('burgdienstplan');
    
    // Check if admin user already exists
    const existingUser = await db.collection('users').findOne({ username: 'admin' });
    
    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Admin user already exists' })
      };
    }
    
    // Create admin user
    const result = await db.collection('users').insertOne({
      username: 'admin',
      password: 'Ratzendorf55', // We'll implement proper password hashing later
      role: 'kastellan',
      created_at: new Date()
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Admin user created successfully', userId: result.insertedId })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error creating admin user' })
    };
  } finally {
    if (client) await client.close();
  }
};
