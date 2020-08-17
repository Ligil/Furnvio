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

//View featured by admins feedback
router.get('/adminfeaturedFeedback', ensureAuthenticated, (req, res) => {
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
		res.render('question/adminfeaturedfeedback', {
			feedbacks:feedbacks
		});
	})
	.catch(err => console.log(err));
})

//FEEDBACK - Answer feedback PUT (save)
router.put('/saveAnsweredFeedback/:id', ensureAuthenticated, (req, res) => {
	let id = req.params.id;
	let {answer, featured} = req.body;
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


//FEEDBACK - Delete Feedback 
router.get('/deleteFeedback/:id', ensureAuthenticated, (req, res) => {
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
        }).then((feedbacks) =>{ 
            alertMessage(res, 'success', 'Successfuly Deleted', 'fas fa-exclamation-circle', true);
            res.redirect('../rfeedback');
		})
	}
	});
});

//FEEDBACK - Retrieve Feedback
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

router.get('/unfeatureFeedback/:id', ensureAdmin, (req, res) => {
	let id = req.params.id;
	let featured = 0;
	Feedback.update({
		featured: featured
    }, {
        where: {
            id: id
        }
        }).then(() => {
			alertMessage(res, 'success', 'Question Unfeatured!', 'fas fa-exclamation-circle', true);
            res.redirect('../adminfeaturedfeedback');
        }).catch(err => console.log(err));

}); 


module.exports = router;