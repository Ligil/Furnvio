const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database.
Note that Sequelize automatically pleuralizes the entity name as the table name
*/


const Cart = db.define('cart', {
    quantity: {
        type: Sequelize.INTEGER
    },
});
module.exports = Cart;






// module.exports = function Cart(oldcart){
//     this.item = oldcart.items;
//     this.totalQty = oldcart.totalQty;
//     this.totalPrice = oldcart.totalPrice;

//     this.add = function(item,id){
//         var storedItem = this.item[id];
//         if (!storedItem){
//             storedItem = this.items[id] = {item: item, qty: 0, price: 0};
//         };
//         storedItem.qty++;
//         storedItem.price =  storedItem.item.price * storedItem.qty;
//         this.totalQty++;
//         this.totalPrice  += storedItem.price;
//     };
//     this.generateArray = function (){
//         var arr = [];
//         for (var id in this.items){
//             arr.push (this.items[id]);
//         };
//         return arr;
//     };
// };
