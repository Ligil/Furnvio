const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Categories = db.define('categories', {
    category: {
        type: Sequelize.STRING
    },
    categoryImageURL: {
        type: Sequelize.STRING
    },
    categoryDescription: {
        type: Sequelize.STRING(2000)
    }
});
module.exports = Categories;

