const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const tempOrder = db.define('tempOrder', {
    userId: {
        type: Sequelize.INTEGER
    },
    addressId: {
        type: Sequelize.INTEGER
    },
    totalprice: {
        type: Sequelize.INTEGER
    }
});
module.exports = tempOrder;
