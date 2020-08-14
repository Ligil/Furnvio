const mySQLDB = require('./DBConfig');
const user = require('../models/User');
const video = require('../models/Video');
const cart = require('../models/Cart');
const feedback = require('../models/Feedback')
const reviews = require('../models/Review')

const furniture = require('../models/Furniture');
const themes = require('../models/Themes');
const furnitureToThemes = require('../models/FurnitureThemes')
const categories = require('../models/Categories');
const furnitureToCategories = require('../models/FurnitureCategories')
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
        furniture.belongsToMany(themes, { through: furnitureToThemes });
        themes.belongsToMany(furniture, { through: furnitureToThemes });
        furniture.hasMany(furnitureToThemes);
        furnitureToThemes.belongsTo(furniture);
        themes.hasMany(furnitureToThemes);
        furnitureToThemes.belongsTo(themes);

        furniture.belongsToMany(categories, { through: furnitureToCategories });
        categories.belongsToMany(furniture, { through: furnitureToCategories });
        furniture.hasMany(furnitureToCategories);
        furnitureToCategories.belongsTo(furniture);
        categories.hasMany(furnitureToCategories);
        furnitureToCategories.belongsTo(categories);
    

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
