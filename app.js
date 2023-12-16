'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const logger = require('morgan');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();
const { mongoose } = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const indexRouter = require('./routers/indexRouter');
const productRouter = require('./routers/productRouter');
const clientRouter = require('./routers/clientRouter');
const invoiceRouter = require('./routers/invoiceRouter');
const userRouter = require('./routers/userRouter');

const app = express();
const port = process.env.PORT || 3003;

//set up database
const uri = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(uri, { useNewUrlParser: true });
const db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(
  require('express-session')({
    secret: 'a long time ago in a galaxy far far away',
    resave: false,
    saveUninitialized: false
  })
);

// Initialize passport and configure for User model
app.use(passport.initialize());
app.use(passport.session());
const User = require('./models/User');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//tell Express where to find our templates (views) and set the view engine to ejs
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//find static files from public folder
app.use(express.static(__dirname + '/public'));

//log request using dev template from morgan package
app.use(logger('dev'));

// Enable layouts and set the default layout
app.use(expressLayouts);
app.set('layout', './layouts/full-width');

//set up routers
app.use('/', indexRouter);
app.use('/products', productRouter);
app.use('/clients', clientRouter);
app.use('/invoices', invoiceRouter);
app.use('/user', userRouter);

//the catch all error page
app.all('/*', (req, res) => {
  res.status(404).send('This page does not exist!');
});

//close db connection on shut down of the app
process.on('SIGTERM', () => {
  db.close();
});

app.listen(port, () => console.log(`app listening on port ${port}!`));
