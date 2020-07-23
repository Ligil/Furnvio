const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const Furniture = db.define('furniture', {
    furnitureName: {
        type: Sequelize.STRING
    },
    cost: {
        type: Sequelize.NUMERIC(8,2)
    },
    description: {
        type: Sequelize.STRING(2000)
    },
    lengthmm: { 
        type: Sequelize.INTEGER
    },
    widthmm: {
        type: Sequelize.INTEGER
    },
    heightmm: {
        type: Sequelize.INTEGER
    },
    imageURL: {
        type: Sequelize.STRING
    },
    addedBy: {
        type: Sequelize.INTEGER
    },
    lastEditedBy: {
        type: Sequelize.INTEGER
    }
});
module.exports = Furniture;
