const mongoose = require('mongoose');
require('dotenv').config();

const connect = mongoose.connect(process.env.MONGO_URI);

// Connect to the database
connect.then(() => {
  console.log('Connected correctly to server');
})
  .catch((err) => {
    console.log(err);
  });

// Define the user schema
const userSchema = new mongoose.Schema({
  googleId: String,
  displayName: String,
  firstName: String,
  lastName: String,
  image: String,
  email: String,
  accessToken: String,
  refreshToken: String,
});

// Create a model from the schema and export it as the default
const User = mongoose.model('users', userSchema);

module.exports = User;
