const express = require('express');
const alertMessage = require('../helpers/messenger');
const router = express.Router();

const {ensureAuthenticated, ensureAdmin} = require('../helpers/auth')

//Models
const User = require('../models/User');
const Feedback = require('../models/Feedback');

//Submit feedback - user action
router.get('/', (req, res) =>{
	res.render('question/feedback')
});

//Submit feedback POST - user action
router.post('/', ensureAuthenticated, (req, res) => {
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

//Retrieve submitted feedbacks - user action
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

//View featured by admins feedback
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
		res.render('question/featuredfeedback', {
			feedbacks:feedbacks
		});
	})
	.catch(err => console.log(err));
})

module.exports = router;