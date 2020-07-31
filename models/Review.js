const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const Review = db.define('review', {
    reviewText: {
        type: Sequelize.STRING(2000)
    },
    rating: { 
        type: Sequelize.INTEGER
    },
    imageURL: {
        type: Sequelize.STRING
    },
    time: {
        type: Sequelize.DATE
    }
});
module.exports = Review;
