const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const Themes = db.define('themes', {
    theme: {
        type: Sequelize.STRING
    }
    // furnitureIds: {
    //     type: Sequelize.STRING,
    //     allowNull: true,
    //     get() {
    //         return this.getDataValue('furnitureIds').split(';')
    //     },
    //     set(val) {
    //        this.setDataValue('furnitureIds',val.join(';'));
    //     },
    // }
});
module.exports = Themes;

