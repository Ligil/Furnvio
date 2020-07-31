const mySQLDB = require('./DBConfig');
const user = require('../models/User');
const video = require('../models/Video');
const furniture = require('../models/Furniture');
const cart = require('../models/Cart');
const feedback = require('../models/Feedback')
const themes = require('../models/Themes');
const categories = require('../models/Categories');
const reviews = require('../models/Review')
// If drop is true, all existing tables are dropped and recreated
const setUpDB = (drop) => {
    mySQLDB.authenticate()
        .then(() => {
            console.log('Vidjot database connected');
        })
        .then(() => {
        /*
        Defines the relationship where a user has many videos.
        In this case the primary key from user will be a foreign key
        in video.
        */
        user.hasMany(video); //VERY IMPORTANT LINE FOR FOREIGN KEY
        user.hasMany(cart);
        furniture.hasMany(cart);

        cart.belongsTo(user);
        cart.belongsTo(furniture);
        
        user.hasMany(feedback);
        feedback.belongsTo(user);

        //For furniture + themes + categories
        furniture.hasMany(themes);
        furniture.hasMany(categories);
        themes.belongsTo(furniture);
        categories.belongsTo(furniture);
    
        // For reviews
        furniture.hasMany(reviews)
        reviews.belongsTo(furniture)
        user.hasMany(reviews)
        reviews.belongsTo(user)

        mySQLDB.sync({ // Creates table if none exists
            force: drop
        }).then(() => {
            console.log('Create tables if none exists')
        }).catch(err => console.log(err))
    })
    .catch(err => console.log('Error: ' + err));
};

module.exports = { setUpDB };
