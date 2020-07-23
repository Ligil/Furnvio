const express = require('express');
const alertMessage = require('../helpers/messenger');
const sequelize = require('../config/DBConfig')
const router = express.Router();
const jwt = require('jsonwebtoken');
const url = require('url');

const {ensureAuthenticated, ensureAdmin} = require('../helpers/auth')

//Models
const User = require('../models/User');
const Furniture = require('../models/Furniture');
const Cart = require('../models/Cart');
const Themes = require('../models/Themes');
const Categories = require('../models/Categories');

//SOME ROUTES
router.get('/', (req, res) => {
	const title = 'BRANDNAME';
	res.render('home', {title: title}) 
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
	alertMessage(res, 'danger','Unauthorised access', 'fas fa-exclamation-circle', false);

	let success_msg = 'Success message!';
	let error_msg = 'Error message using error_msg';
	let errors = [{text:'Error message using error object'}, {text:'First error message'}, {text:'Second error message'}, {text:'Third error message'}];

	res.render('about', {
		title: title,
		success_msg: success_msg,
		error_msg: error_msg,
		errors: errors
	}) 
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

			res.render('cart', {
				cart: cart,
				title: title,
				total: totalTotalPrice
			});
		})
		.catch(err => console.log(err));
});
//VAJON PART END

//JUN LENG PART
router.get('/userfeedback', ensureAuthenticated, (req, res) => {
	Feedback.findAll({
		include: [{model: User, as: 'user'}],
		where: {
			userId : req.user.id
		},
		order: [
			['id', 'ASC'] 
		],
		raw: true
	})
	.then((feedbacks) => {
		const title = 'BRANDNAME - User Feedback';
		res.render('question/userquestions', {
			feedbacks,
			title: title
		});
	})
	.catch(err => console.log(err));
});
router.get('/feedback', (req, res) =>{
	res.render('question/feedback')
});
router.get('/rfeedback', ensureAuthenticated, (req, res) => {
	Feedback.findAll({
		include: [{model: User, as: 'user'}],
		order: [
			['id', 'ASC'] 
		],
		raw: true
	})
	.then((feedbacks) => {
		const title = 'BRANDNAME - Retrieve Feedback';
		res.render('question/rfeedback', {
			feedbacks,
			title: title
		});
	})
	.catch(err => console.log(err));
});
router.post('/feedback', ensureAuthenticated, (req, res) => {
    let feedbacktype = req.body.feedbacktype;
    let feedback = req.body.feedback;
	let userId = req.user.id;
    // Multi-value components return array of strings or undefined
    Feedback.create({
		feedbacktype:feedbacktype,
		feedback:feedback,
		answer:null,
		userId:userId,
		featured: 0
    }) 
    .then(feedback => {
		alertMessage(res, 'success', 'Your feedback has been sent!', 'fas fa-exclamation-circle', true);
		res.redirect('/feedback');
    })
    .catch(err => console.log(err))
});
router.get('/answerFeedback/:id', ensureAuthenticated, (req, res) => {
    Feedback.findByPk(req.params.id)
	.then((feedback) => {
		id = req.params.id;
        res.render('question/answer', {
			feedback,
			id
        });
    }).catch(err => console.log(err)); // To catch no video ID
});
router.put('/saveEditedFeedback/:id', ensureAuthenticated, (req, res) => {
	let id = req.params.id;
	let {answer, featured} = req.body;
	console.log(id)
	Feedback.update({
		answer, 
		featured
    }, {
        where: {
            id: id
        }
        }).then(() => {
			alertMessage(res, 'success', 'Question Answered!', 'fas fa-exclamation-circle', true);
            res.redirect('../rfeedback');
        }).catch(err => console.log(err));

}); 
router.get('/deleteFeedback/:id', ensureAuthenticated, (req, res) => {
	let userId = req.user.id
	Feedback.findOne({
        where: {
			id: req.params.id,
        }
    }).then((feedbacks) => {
        if (feedbacks == null){
            //req.logout();
            alertMessage(res, 'danger', 'Unauthorized access to feedbacks', 'fas fa-exclamation-circle', true);
            res.redirect('/rfeedback');
            return
		}
		else {
        	Feedback.destroy({
            where: {
                id: feedbacks.id
            }
        }).then((feedbacks) =>{ //video2 returns int(1)
            alertMessage(res, 'success', 'Successfuly Deleted', 'fas fa-exclamation-circle', true);
            res.redirect('/rfeedback');
		})
	}
	});
});
router.get('/featuredFeedback', ensureAuthenticated, (req, res) => {
	Feedback.findAll({
		order: [
			['feedbacktype', 'ASC'] 
		],

		where: {
			featured: 1
		},
		raw: true
	})
	.then((feedbacks) => {
		console.log(feedbacks)
		res.render('question/featuredfeedback', {
			feedbacks:feedbacks
		});
	})
	.catch(err => console.log(err));
})
//JUN LENG PART END

//FOR SEARCHING ITEMS IN NAVBAR 
router.post('/searchValue', (req, res) => {
	if (req.body.searchInput == ''){
		res.json([])
	} else {
		let searchVals = req.body.searchInput;

		let conditions = []
		for (var x in searchVals){
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
		}).then(result => {
			res.json(result)
		})


	}	
})


//TEST URLS
router.get('/test/:id', (req, res) =>{
	let email = 'Ligilblightguard@gmail.com'
	let token;
	jwt.sign({'email': email}, '0wOs34ARuWhY',(err, jwtoken) => { //uses email and key for, jwtoken is the resulting token
		if (err) console.log('ERRORUSER107 - Error generating Token when registering: ' + err);
		token = jwtoken; //token variable saves jwtoken
		jwt.verify(token, '0wOs34ARuWhY', (err, authData) => { //L: Use different token keys for different functions, just in case as generated tokens can be reused regardless of server, if they guess your key, hackers might be able to do bad stuff
			if (err) {
				console.log('ERRORUSER102 - invalid token use for email ')
				alertMessage(res, 'danger', 'Invalid or Expired Token, please send resend email or contact staff for help', 'fas faexclamation-circle', true);
			} else {
				console.log('Important data: '+ authData.email)
				res.render('test', {id: req.params.id})
			}
		});
	});
})
router.get('/test2', (req, res) =>{
    var url_parts = url.parse(req.url, true);
	var query = url_parts.query; //all url queries
	//OBJECTIVE: query will contain theme:monochrome and category:wood keys
	//Use these keys to create conditions to search Furniture for suitable furniture
	console.log(query)
	var themes = query['themes[]']
	var categories = query['categories[]']
	
	if (!(Array.isArray(themes))){ themes = [themes] }
	if (!(Array.isArray(categories))){ categories = [categories] }

	// if (themes.length != 0){ themes = {model: Themes, attributes: ['theme'], where: { [require("sequelize").Op.or]: themes }} } 
	// else { themes = {model: Themes, attributes: ['theme']} }
	// if (categories.length != 0){ categories = {model: Categories, attributes: ['category'], where: { [require("sequelize").Op.or]: categories } }  }
	// else { categories = {model: Categories, attributes: ['category']} }

	console.log(themes, categories)
	//Get ids that fit requirements
	Furniture.findAll({
		include: [
			{ model: Themes, where: { theme: { [require("sequelize").Op.in]: themes} } }, 
			{ model: Categories, where: { category: { [require("sequelize").Op.in]: categories} } }
		],
		group: ["furniture.id"],
		having: sequelize.where(
			sequelize.fn('count', sequelize.col('furniture.id')), { [require("sequelize").Op.gte]: 1 } 
		)
	}).then(furniture => {
		console.log(furniture)
	})

	res.render('test2', {id: req.params.id, layout: 'test'})

});
router.post('/test2', (req, res) => {
	keys = Object.keys(req.body)

	// Filter themes
	themeList = keys.filter( function(key) {
		return key.startsWith("Theme:")
	}).map( function(key2) {
		return key2.substring(key2.indexOf(":") + 1)
	});

	for (indexVal in themeList){
		var themeName = themeList[indexVal];
		console.log(themeName)
		Themes.create({
			theme: themeName,
			furnitureId: 10
		}).then(theme => {
			console.log(theme.theme, theme.furnitureId)
		})
	}

	categoryList = keys.filter( function(key) {
		return key.startsWith("Category:")
	}).map( function(key2) {
		return key2.substring(key2.indexOf(":") + 1)
	});

	for (indexVal in categoryList){
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
