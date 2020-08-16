const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const discountCode = db.define('discountCode', {
    discountCode: {
        type: Sequelize.STRING
    },
    subDis: {
        type: Sequelize.FLOAT
    },
    perDis: {
        type: Sequelize.FLOAT
    }
});
module.exports = discountCode;

