const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const teamRoutes = require('./routes/teamRoutes');

//connect to mongodb  --->task db
mongoose.connect('mongodb://127.0.0.1:27017/task').then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const app = express();
app.use(bodyParser.json());
app.use('/api', teamRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
