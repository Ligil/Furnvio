const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Categories = db.define('categories', {
    category: {
        type: Sequelize.STRING
    }
});
module.exports = Categories;

