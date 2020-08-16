const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const Address = db.define('address', {
    userId: {
        type: Sequelize.INTEGER
    },
    address: {
        type: Sequelize.STRING
    },
    unitNo: {
        type: Sequelize.STRING
    },
    postal: {
        type: Sequelize.FLOAT
    }
});
module.exports = Address;