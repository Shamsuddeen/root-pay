const express       = require('express');
const dotenv        = require('dotenv');
const bodyParser    = require('body-parser');
const mongoose      = require('mongoose');
const cors          = require('cors');
const morgan        = require('morgan');
const cookieParser = require('cookie-parser');

// Load ENV vars
dotenv.config({ path: './.env'});
// Initialise the app
const connectDB = require('./Config/db');

// Connect to database
connectDB();
const app = express();

// Import routes files
const auth = require("./Route/auth");

// Configure bodyparser to handle post requests
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
// Cookie parser
app.use(cookieParser());
app.use(cors());

var port = process.env.PORT || 5000;
app.get('/', (req, res) => res.send('Hello from Root.Cards'));

// Development logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// Mount API routes in the App
app.use('/auth', auth);

// Launch app to listen to specified port
app.listen(port, function () {
    console.log(`Running Root.Cards in ${process.env.NODE_ENV} mode on port ` + port);
});