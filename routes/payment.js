const express = require('express');
const paypal = require('paypal-rest-sdk');
const stripe = require('stripe')('sk_test_51GzxYAGs0S0NVDtKV4WOkcliVJND17yu9LfEtpm3isRqKU2huh5U8ooVqCOZK57S6GuQpXurOIqYREZI8tSerVOS00ZONhhcNe');

const router = express.Router();
// SendGrid
const sgMail = require('@sendgrid/mail');
// JWT JSON Web Token
const jwt = require('jsonwebtoken');

const alertMessage = require('../helpers/messenger');

const Address = require('../models/Address');
const Cart = require('../models/Cart');
const Furniture = require('../models/Furniture');
const { ensureAuthenticated } = require('../helpers/auth');
const tempOrder = require('../models/tempOrder');
const { max } = require('moment');
const sequelize = require('../config/DBConfig');
const Order = require('../models/Order');
const User = require('../models/User');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AXAObybj14BUxQaHZDb4vNbu380-yaFzNaugO6MJ5DAGDBcC-12W6uKnEQSj51o00vN1I8AGmCy8zod6',
    'client_secret': 'EC4jM6-ouSmdJ4bi9vqOpaFelJLqqVN9sJFUFQGm3YQmDGKQ8kxrWN4TgMYlDq-_pzJfy7BbsEJkmANQ'
});


router.post('/paypal', (req,res) => {
    const addressId = req.body.addressId;
    Cart.findAll({
		include: [{ model: Furniture, as: 'furniture' }],
		where: {
			userId: req.user.id,
		},
		order: [
			['id', 'ASC']
		],
		raw: true
	})
	.then((cart) => {
		const title = 'BRANDNAME - Cart';
		var totalTotalPrice = 0.00
		for (i in cart) {
			cartObject = cart[i];
			totalPrice = parseFloat(cartObject['furniture.cost']) * cartObject.quantity;
			cart[i]['totalPrice'] = totalPrice;
			totalTotalPrice += totalPrice;
        }
        tempOrder.update({
            addressId,
            totalprice: totalTotalPrice
        }, {
            where: {
                userId: req.user.id,}
        })
        const create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": "http://localhost:5000/payment/success/paypal",
                "cancel_url": "http://localhost:5000/payment/cancel"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "awesome hat",
                        "price": totalTotalPrice,
                        "currency": "SGD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": "SGD",
                    "total": totalTotalPrice
                },
                "description": "This is the payment description."
            }]  
        };
        paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                throw error;
            } else {
                for(let i = 0;i <payment.links.length;i++){
                    if(payment.links[i].rel === 'approval_url'){
                        res.redirect(payment.links[i].href);
                    }
                }
            }
        });
    });
});

router.post('/stripe', (req, res) => {
    const addressId = req.body.addressId;
    const email = User.findOne({where:{userId:req.user.id}, attributes: ['email']});
    Cart.findAll({
        include: [{ model: Furniture, as: 'furniture' }],
        where: {
            userId: req.user.id,
        },
        order: [
            ['id', 'ASC']
        ],
        raw: true
    })
    .then((cart) => {
        const title = 'BRANDNAME - Cart';
        var totalTotalPrice = 0.00
        for (i in cart) {
            cartObject = cart[i];
            totalPrice = parseFloat(cartObject['furniture.cost']) * cartObject.quantity;
            cart[i]['totalPrice'] = totalPrice;
            totalTotalPrice += totalPrice;
        }
        const amount = totalTotalPrice * 100;
        const token = req.body.stripeToken;

        stripe.customers.create({
            email: req.body.stripeEmail,
            source: req.body.stripeToken
        })
        .then(customer => stripe.charges.create({
          amount,
          description: 'payment',
          currency: 'sgd',
          customer: customer.id
        }))
        .then((charge) => {
            const userId = req.user.id;
            const totalPrice = totalTotalPrice;
            const paymentId = charge['id']
            Order.create({
                userId,
                addressId,
                paymentId,
                totalPrice,
                order:cart
            }),
            tempOrder.destroy({
                where: {
                    userId: req.user.id,
                }
            }),
            Cart.destroy({
                where: {
                    userId: req.user.id,
                }
            }),
            sendPurchaseEmail(email, totalPrice),
            res.redirect('success/stripe')});
    });
});
  

router.get('/success/:id', (req,res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const id = req.params.id;
    const email = User.findOne({where:{userId:req.user.id}, attributes: ['email']});

    Cart.findAll({
		include: [{ model: Furniture, as: 'furniture' }],
		where: {
			userId: req.user.id,
		},
		order: [
			['id', 'ASC']
		],
		raw: true
	})
	.then((cart) => {
		const title = 'BRANDNAME - Cart';
		var totalTotalPrice = 0.00
		for (i in cart) {
			cartObject = cart[i];
			totalPrice = parseFloat(cartObject['furniture.cost']) * cartObject.quantity;
			cart[i]['totalPrice'] = totalPrice;
			totalTotalPrice += totalPrice;
		}
        const execute_payment_json = {
            "payer_id": payerId,
            "transactions": [{
                "amount": {
                    "currency": "SGD",
                    "total": totalTotalPrice
                }
            }]
        };
        tempOrder.findOne({
            where: {
                userId: req.user.id,
            }
        }).then((temp) => {
            if(id == 'paypal'){
                paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
                    if (error) {
                        console.log(error.response);
                        throw error;
                    } else {
                        const userId = req.user.id
                        const totalPrice = totalTotalPrice
                        const paymentId = payment['id']
                        const addressId = temp.addressId

                        Order.create({
                            userId,
                            addressId,
                            paymentId,
                            totalPrice,
                            order: cart
                        })
                        tempOrder.destroy({
                            where: {
                                userId: req.user.id,
                            }
                        })
                        Cart.destroy({
                            where: {
                                userId: req.user.id,
                            }
                        })
                        sendPurchaseEmail(email, totalPrice)
                        alertMessage(res, 'info', 'Payment has been processed. Thank you for purchasing', 'fas fa-exclamation-circle', true);
                        res.redirect('/');
                    }
                });   
            } else {
                alertMessage(res, 'info', 'Payment has been processed. Thank you for purchasing', 'fas fa-exclamation-circle', true);
                res.redirect('/');
            }
        })
    });
});

function sendPurchaseEmail(email, price){
    sgMail.setApiKey('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');
    console.log('Sending email')
    var htmlText = "<h1>FURNVIO</h1><br><br> You have been charged S$" + price +"<br><br>\
                    Thank you for purchasing on FURNVIO.<br><br> \
                    Login to your account to check your order."
    const message = {
        to: email,
        from: "furnvio@gmail.com",
        subject: "Purchase Receipt",
        text: "FURNVIO Receipt",
        html: htmlText
    };
    // Returns the promise from SendGrid to the calling function
    return new Promise((resolve, reject) => {
        sgMail.send(message)
        .then(msg => resolve(msg))
        .catch(err => reject(err));
    });
}

router.get('/cancel', (req, res) => res.send('Cancelled'));

router.get('/checkout', ensureAuthenticated, (req, res) => {
    Address.findAll({ 
        where: { 
            userId: req.user.id 
        },
        raw: true
    })
    .then((addresses) => {
        Cart.findAll({
            include: [{ model: Furniture, as: 'furniture' }],
            where: {
                userId: req.user.id,
            },
            order: [
                ['id', 'ASC']
            ],
            raw: true
        })
        .then((cart) => {
            const title = 'FURNVIO - Cart';
            var totalTotalPrice = 0.00
            for (i in cart) {
                cartObject = cart[i];
                totalPrice = parseFloat(cartObject['furniture.cost']) * cartObject.quantity;
                cart[i]['totalPrice'] = totalPrice;
                totalTotalPrice += totalPrice;
            }
            const totalprice = totalTotalPrice
            tempOrder.create({
                userId: req.user.id,
                totalprice
            })
            res.render('checkout', {           
                addresses: addresses,
                cart: cart,
                title: title,
                total: totalTotalPrice
            });
        })
    })
    .catch(err => console.log(err));
})



module.exports = router;


