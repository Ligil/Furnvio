const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const Themes = db.define('themes', {
    theme: {
        type: Sequelize.STRING
    },
    themeImageURL: {
        type: Sequelize.STRING
    },
    themeDescription: {
        type: Sequelize.STRING(2000)
    }
});
module.exports = Themes;

