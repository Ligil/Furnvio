const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
const sequelize = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const Order = db.define('order', {
    userId: {
        type: Sequelize.INTEGER
    },  
    totalPrice: {
        type: Sequelize.FLOAT
    },
    addressId: {
        type: Sequelize.INTEGER
    },
    paymentId: {
        type: Sequelize.STRING
    },
    order: {
        type: Sequelize.JSON
    },
    orderStatus: {
        type: Sequelize.STRING
    }    
});
module.exports = Order;
