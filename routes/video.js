const express = require('express');
const router = express.Router();
const moment = require('moment'); //time formatting
const Video = require('../models/Video'); //Models
const {ensureAuthenticated, ensureAdmin} = require('../helpers/auth')
const alertMessage = require('../helpers/messenger');
//uploading and file system
const fs = require('fs');
const upload = require('../helpers/imageUpload');

// List videos belonging to current logged in user
router.get('/listVideos', ensureAuthenticated, (req, res) => {    
    Video.findAll({ //find all videos from models/video (video schema)
        where: { 
            userId: req.user.id //that has foreign key attribute userId == current logged in req.user.id
        },
        order: [
            ['title', 'ASC'] 
        ],
        raw: true
    })
    .then((videos) => {
        // pass object to listVideos.handlebar
        console.log(videos)
        res.render('video/listVideos', {
            videos: videos
        });
    })
    .catch(err => console.log(err));
});
    
router.get('/showAddVideo', ensureAuthenticated, (req, res) => {
    res.render('video/addVideo')
})

router.post('/showAddVideo', ensureAuthenticated, (req, res) => {
    let title = req.body.title;
    let story = req.body.story.slice(0, 1999);
    let dateRelease = moment(req.body.dateRelease, 'DD/MM/YYYY');
    let language = req.body.language.toString();
    let subtitles = req.body.subtitles === undefined ? '' : req.body.subtitles.toString();
    let classification = req.body.classification;
    let posterURL = req.body.posterURL
    let starring = req.body.starring

    let userId = req.user.id;
    // Multi-value components return array of strings or undefined
    Video.create({
        title,
        story,
        classification,
        language,
        subtitles,
        dateRelease,
        posterURL,
        starring,
        userId
    }) 
    .then(video => {
        res.redirect('/video/listVideos');
    })
    .catch(err => console.log(err))
});

// Shows edit video page
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
    Video.findOne({
        where: {
            id: req.params.id
        }
    }).then((video) => {
        if (req.user.id != video.userId){
            //req.logout();
            alertMessage(res, 'danger', 'Access Denied', 'fas fa-exclamation-circle', true);
            res.redirect('/logout');
            return
        };
        //or res.redirect('/logout');

        checkOptions(video);
        // call views/video/editVideo.handlebar to render the edit video page
        res.render('video/editVideo', {
            video // passes video object to handlebar
        });
    }).catch(err => console.log(err)); // To catch no video ID
});
// Creates variables with ‘check’ to put a tick in the appropriate checkbox
function checkOptions(video){
    video.chineseLang = (video.language.search('Chinese') >= 0) ? 'checked' : '';
    video.englishLang = (video.language.search('English') >= 0) ? 'checked' : '';
    video.malayLang = (video.language.search('Malay') >= 0) ? 'checked' : '';
    video.tamilLang = (video.language.search('Tamil') >= 0) ? 'checked' : '';
    video.chineseSub = (video.subtitles.search('Chinese') >= 0) ? 'checked' : '';
    video.englishSub = (video.subtitles.search('English') >= 0) ? 'checked' : '';
    video.malaySub = (video.subtitles.search('Malay') >= 0) ? 'checked' : '';
    video.tamilSub = (video.subtitles.search('Tamil') >= 0) ? 'checked' : '';
}

// Save edited video
router.put('/saveEditedVideo/:id', ensureAuthenticated, (req, res) => {
    // Retrieves edited values from req.body
    let title = req.body.title;
    let story = req.body.story.slice(0, 1999);
    let dateRelease = moment(req.body.dateRelease, 'DD/MM/YYYY');
    let language = req.body.language.toString();
    let subtitles = req.body.subtitles === undefined ? '' : req.body.subtitles.toString();
    let classification = req.body.classification;
    let posterURL = req.body.posterURL
    let starring = req.body.starring

    Video.update({
        // Set variables here to save to the videos table
        title,
        story,
        classification,
        language,
        subtitles,
        dateRelease,        
        posterURL,
        starring
    }, {
        where: {
            id: req.params.id
        }
        }).then(() => {
            // After saving, redirect to router.get(/listVideos...) to retrieve all updated
            // videos
            res.redirect('/video/listVideos');
        }).catch(err => console.log(err));
}); 


router.get('/delete/:id', ensureAuthenticated, (req, res) => {
	Video.findOne({
        where: {
            id: req.params.id,
            userId: req.user.id
        }
    }).then((video) => {
        if (video == null){
            //req.logout();
            alertMessage(res, 'danger', 'Unauthorized access to video', 'fas fa-exclamation-circle', true);
            res.redirect('/logout');
            return
        };
        Video.destroy({
            where: {
                id: video.id
            }
        }).then((video2) =>{ //ideo2 returns int(1)
            alertMessage(res, 'success', 'Successful delete', 'fas fa-exclamation-circle', true);
            res.redirect('/video/listVideos');
        })

	});
});

router.post('/upload', ensureAuthenticated, (req, res) => {
    // Creates user id directory for upload if not exist
    if (!fs.existsSync('./public/uploads/' + req.user.id)){
        fs.mkdirSync('./public/uploads/' + req.user.id);
    }
    upload(req, res, (err) => {
        if (err) {
            res.json({file: '/img/no-image.jpg', err: err});
        } else {
            if (req.file === undefined) {
                res.json({file: '/img/no-image.jpg', err: err});
            } else {
                res.json({file: `/uploads/${req.user.id}/${req.file.filename}`});
            }
        }
    });
})
    




module.exports = router