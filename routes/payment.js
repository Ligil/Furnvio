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
const discountCode = require('../models/discountCode');
const { NULL } = require('node-sass');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AXAObybj14BUxQaHZDb4vNbu380-yaFzNaugO6MJ5DAGDBcC-12W6uKnEQSj51o00vN1I8AGmCy8zod6',
    'client_secret': 'EC4jM6-ouSmdJ4bi9vqOpaFelJLqqVN9sJFUFQGm3YQmDGKQ8kxrWN4TgMYlDq-_pzJfy7BbsEJkmANQ'
});


router.post('/paypal', (req, res) => {
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
                    userId: req.user.id,
                }
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
                    for (let i = 0; i < payment.links.length; i++) {
                        if (payment.links[i].rel === 'approval_url') {
                            res.redirect(payment.links[i].href);
                        }
                    }
                }
            });
        });
});

router.post('/stripe', (req, res) => {
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
                    tempOrder.findOne({where: {userId:req.user.id}})
                    .then((temp) => {
                        User.findOne({ where: { id: req.user.id }})
                        .then((email) => {
                            const userId = req.user.id;
                            const totalPrice = temp.totalprice
                            const paymentId = charge['id']
                            Order.create({
                                userId,
                                addressId,
                                paymentId,
                                totalPrice,
                                order: cart
                            }),
                                tempOrder.destroy({where: {userId: req.user.id}}),
                                Cart.destroy({where: {userId: req.user.id}}),
                                sendPurchaseEmail(email, totalPrice),
                                res.redirect('success/stripe')
                        })
                    })
                });
        });
});


router.get('/success/:id', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const id = req.params.id;

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
                if (id == 'paypal') {
                    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
                        if (error) {
                            console.log(error.response);
                            throw error;
                        } else {
                            User.findOne({ where: { id: req.user.id }})
                            .then((email) => {
                                const userId = req.user.id
                                const totalPrice = temp.totalprice
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
                            })
                        }
                    });
                } else {
                    alertMessage(res, 'info', 'Payment has been processed. Thank you for purchasing', 'fas fa-exclamation-circle', true);
                    res.redirect('/');
                }
            })
        });
});

function sendPurchaseEmail(email, price) {
    sgMail.setApiKey('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');
    console.log('Sending email')
    var htmlText = "<h1>FURNVIO</h1><br><br> You have been charged S$" + price + "<br><br>\
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
            tempOrder.findOne({wher :{userId: req.user.id}})
            .then((temp) => {
                res.render('checkout', {
                    addresses: addresses,
                    temp: temp,
                });
            })
        })
        .catch(err => console.log(err));
})

router.post('/checkDis', (req, res) => {
    console.log(req.body.disCode)
    if(req.body.disCode == ''){
        res.json({response: 0})
    } else {
        let disCode = req.body.disCode
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
                    var totalTotalPrice = 0.00
                    for (i in cart) {
                        cartObject = cart[i];
                        totalPrice = parseFloat(cartObject['furniture.cost']) * cartObject.quantity;
                        cart[i]['totalPrice'] = totalPrice;
                        totalTotalPrice += totalPrice;
                    }
                    tempOrder.findOne({where: {userId:req.user.id}})
                    .then((temp) => {
                        discountCode.findOne({where:{discountCode:disCode}})
                        .then((discount) => {
                            if(discount == null){
                                res.json({response:2})
                            } else {
                                if(discount['perDis'] != null || discount['perDis'] != 0){
                                    let price = temp.totalprice
                                    price = price * discount['perDis']
                                    tempOrder.update({totalprice: price}, {where: {userId: req.user.id}})
                                    alertMessage(res, 'success', 'Successfully used discount code', 'fas fa-exclamation-circle', true);
                                    res.json({response:1})
                                }
                                if(discount['subDis'] != null || discount['subDis'] != 0){
                                    let price = temp.totalprice
                                    price = price - discount['subDis']
                                    tempOrder.update({totalprice: price}, {where: {userId: req.user.id}})
                                    alertMessage(res, 'success', 'Successfully used discount code', 'fas fa-exclamation-circle', true);
                                    res.json({response:1})
                                }
                            }
                        })
                    })
                })
    }
})


module.exports = router;


