const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const Feedback = db.define('feedback', {
    feedbacktype: {
        type: Sequelize.STRING
    },
    feedback: {
        type: Sequelize.STRING
    },
    answer: {
        type: Sequelize.STRING
    },
    featured: {
        type: Sequelize.BOOLEAN
    },
});
module.exports = Feedback;

