const express = require('express');
const router = express.Router();
const paypal = require('paypal-rest-sdk');
const alertMessage = require('../helpers/messenger');
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AXAObybj14BUxQaHZDb4vNbu380-yaFzNaugO6MJ5DAGDBcC-12W6uKnEQSj51o00vN1I8AGmCy8zod6',
    'client_secret': 'EC4jM6-ouSmdJ4bi9vqOpaFelJLqqVN9sJFUFQGm3YQmDGKQ8kxrWN4TgMYlDq-_pzJfy7BbsEJkmANQ'
});


router.post('/', (req,res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:5000/pay/success",
            "cancel_url": "http://localhost:5000/pay/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "awesome hat",
                    "price": "1000.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "1000.00"
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

router.get('/success', (req,res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "1000.00"
            }
        }]
    };
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));
            res.send('Success');
        }
    });   
});

router.get('/cancel', (req, res) => res.send('Cancelled'));

module.exports = router;



