const express = require('express');
const alertMessage = require('../helpers/messenger');
const sequelize = require('../config/DBConfig')
const router = express.Router();
const jwt = require('jsonwebtoken');
const url = require('url');
const passport = require('passport');

const { ensureAuthenticated, ensureAdmin } = require('../helpers/auth')

//Models
const User = require('../models/User');
const Furniture = require('../models/Furniture');
const Cart = require('../models/Cart');
const Themes = require('../models/Themes');
const Categories = require('../models/Categories');
const tempOrder = require('../models/tempOrder');

//SOME ROUTES
router.get('/', (req, res) => {
	const title = 'BRANDNAME';
	res.render('home', { title: title })
});
router.get('/logout', (req, res) => {
	req.logout();
	alertMessage(res, 'info', 'Bye-bye!', 'fas fa-exclamation-circle', true);
	res.redirect('/');
});

router.get('/about', (req, res) => {
	const title = 'Video Jotter - Register';
	res.render('about', {
		title: title,
	})
});

router.get('/alertTest', (req, res) => {
	const title = 'Video Jotter - Register';
	alertMessage(res, 'success', 'This is an important message', 'fas fa-sign-in-alt', true);
	alertMessage(res, 'danger', 'Unauthorised access', 'fas fa-exclamation-circle', false);

	let success_msg = 'Success message!';
	let error_msg = 'Error message using error_msg';
	let errors = [{ text: 'Error message using error object' }, { text: 'First error message' }, { text: 'Second error message' }, { text: 'Third error message' }];

	res.render('about', {
		title: title,
		success_msg: success_msg,
		error_msg: error_msg,
		errors: errors
	})
});

router.get('/auth/google',
	passport.authenticate('google', {
		scope: ['email', 'profile', 'openid']
	})
);

router.get('/auth/google/callback',
	passport.authenticate('google', {
		successRedirect: '/user/profile',
		failureRedirect: '/login',
		failureFlash: true
	}),
	function (req, res) {
		res.redirect('/');
	});

//SOME ROUTES END

//VAJON PART
router.get('/addToCart/:furnitureId', (req, res) => {
	let furnitureId = req.params.furnitureId;
	let userId = req.user.id

	Cart.findOne({
		where: {
			userId: req.user.id,
			furnitureId: req.params.furnitureId
		}
	}).then((CartItem) => {
		if (!(CartItem)) {
			Cart.create({
				userId,
				furnitureId,
				quantity: 1
			})
		}
		else {
			Cart.update({
				quantity: CartItem.quantity + 1
			}, {
				where: {
					id: CartItem.id
				}
			})
		}

	}).then(() => {
		res.redirect('/cart');
	}).catch(err => console.log(err));
});
router.get('/deleteFromCart/:id', (req, res) => {
	Cart.findOne({
		where: {
			id: req.params.id,
		}
	}).then((cart) => {
		if (cart == null) {
			//req.logout();
			alertMessage(res, 'danger', 'Item does not exist in cart', 'fas fa-exclamation-circle', true);
			res.redirect('/cart');
			return
		};
		Cart.destroy({
			where: {
				id: cart.id
			}
		}).then((cart2) => { //cart2 returns int(1)
			alertMessage(res, 'success', 'Successful delete', 'fas fa-exclamation-circle', true);
			res.redirect('/cart');
		})

	});
});
router.post('/updateCart', (req, res) => {
	var data = req.body;
	for (dataId in data) {
		Cart.update({
			quantity: data[dataId]
		}, {
			where: {
				furnitureId: dataId,
				userId: req.user.id,
			}
		})
	};
	res.status(200).json({
		message: "Hello"
	})
});
router.get('/cart', ensureAuthenticated, (req, res) => {
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
			console.log(cart)

			const totalprice = totalTotalPrice
            tempOrder.create({
                userId: req.user.id,
                totalprice
            })
			tempOrder.update({totalprice}, {where: {userId: req.user.id}})
			
			res.render('cart', {
				cart: cart,
				title: title,
				total: totalTotalPrice
			});
		})
		.catch(err => console.log(err));
});
//VAJON PART END



//FOR SEARCHING ITEMS IN NAVBAR 
router.post('/searchValue', (req, res) => {
	if (req.body.searchInput == '') {
		res.json({furniture: [], category: []})
	} else {
		let searchVals = req.body.searchInput;

		let conditions = []
		for (var x in searchVals) {
			conditions.push({
				furnitureName: {
					[require("sequelize").Op.substring]: searchVals[x]
				}
			});
		}
		
		Furniture.findAll({
			limit: 3,
			where: {
				[require("sequelize").Op.or]: conditions
			},
			raw: true
		}).then(furnitureResult => {

			let conditions2 = []
			for (var x in searchVals) {
				conditions2.push({
					category: {
						[require("sequelize").Op.startsWith]: searchVals[x]
					}
				});
			}

			Categories.findAll({
				limit: 3,
				where: {
					[require("sequelize").Op.or]: conditions2
				},
				raw: true,
				group: ['category'],
				attributes: ['category']
			}).then(categoryResult => {

				Furniture.count({ where: { [require("sequelize").Op.or]: conditions }
				}).then(furnitureCountResult => {
					categoryResultMapped = categoryResult.map(category => category['category'])
					categoryAndFurniture = {furniture: furnitureResult, furnitureCount: furnitureCountResult, category: categoryResultMapped}
					res.json(categoryAndFurniture)
				}).catch(err => console.log(err))

			}).catch(err => console.log(err))
		}).catch(err => console.log(err))


	}
})


//TEST URLS
router.get('/test/:id', (req, res) => {
	let email = 'Ligilblightguard@gmail.com'
	let token;
	jwt.sign({ 'email': email }, '0wOs34ARuWhY', (err, jwtoken) => { //uses email and key for, jwtoken is the resulting token
		if (err) console.log('ERRORUSER107 - Error generating Token when registering: ' + err);
		token = jwtoken; //token variable saves jwtoken
		jwt.verify(token, '0wOs34ARuWhY', (err, authData) => { //L: Use different token keys for different functions, just in case as generated tokens can be reused regardless of server, if they guess your key, hackers might be able to do bad stuff
			if (err) {
				console.log('ERRORUSER102 - invalid token use for email ')
				alertMessage(res, 'danger', 'Invalid or Expired Token, please send resend email or contact staff for help', 'fas faexclamation-circle', true);
			} else {
				console.log('Important data: ' + authData.email)
				res.render('test', { id: req.params.id })
			}
		});
	});
})
router.get('/test2', (req, res) => {
	const sgMail = require('@sendgrid/mail');
	sgMail.setApiKey('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');
	const msg = {
		to: '191885T@mymail.nyp.edu.sg',
		from: 'vajonlim@gmail.com',
		subject: 'Sending with Twilio SendGrid is Fun',
		text: 'and easy to do anywhere, even with Node.js',
		html: '<strong>and easy to do anywhere, even with Node.js</strong>',
	};
	sgMail.send(msg)
	.then(mail => {
		console.log(mail)
	}).catch(err => console.log(err))

});
router.post('/test2', (req, res) => {
	keys = Object.keys(req.body)

	// Filter themes
	themeList = keys.filter(function (key) {
		return key.startsWith("Theme:")
	}).map(function (key2) {
		return key2.substring(key2.indexOf(":") + 1)
	});

	for (indexVal in themeList) {
		var themeName = themeList[indexVal];
		console.log(themeName)
		Themes.create({
			theme: themeName,
			furnitureId: 10
		}).then(theme => {
			console.log(theme.theme, theme.furnitureId)
		})
	}

	categoryList = keys.filter(function (key) {
		return key.startsWith("Category:")
	}).map(function (key2) {
		return key2.substring(key2.indexOf(":") + 1)
	});

	for (indexVal in categoryList) {
		var categoryName = categoryList[indexVal];
		console.log(categoryName)
		Categories.create({
			category: categoryName,
			furnitureId: 10
		}).then(category => {
			console.log(category.category, category.furnitureId)
		})
	}

	res.redirect('/test2');
});

module.exports = router;
