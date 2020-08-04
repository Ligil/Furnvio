const express = require('express');
const router = express.Router();

//Models
const User = require('../models/User');
const Furniture = require('../models/Furniture'); //Models
const Video = require('../models/Video'); //Models
const Feedback = require('../models/Feedback');
const Themes = require('../models/Themes');
const Categories = require('../models/Categories');
//Extras
const alertMessage = require('../helpers/messenger');
const {ensureAuthenticated, ensureAdmin} = require('../helpers/auth')

const fs = require('fs');
const {imageUpload} = require('../helpers/imageUpload');
const { removeJoinMetaData } = require('../helpers/removeMeta');

//USERS - Retrieve Users
router.get('/listUsers', ensureAuthenticated, (req, res) => {
    User.findAll({ //find all users from models/user (user schema)
        order: [ ['id', 'ASC'] ],
        raw: true
    })
    .then((users) => {
		const title = 'BRANDNAME - Admin - Show Users';
        res.render('admin/showUsers', {
			title: title,
            users: users
        });
    })
    .catch(err => console.log(err));
}); 

//USERS - Edit user
router.get('/userEdit/:id', ensureAuthenticated, (req, res) => {
    User.findOne({
        where: { id: req.params.id }
    }).then((user) => {
        res.render('admin/editUser', { user });
    }).catch(err => console.log(err)); // To catch no video ID
});

//USERS - Edit user PUT (save)
router.put('/saveEditedUser/:id', ensureAuthenticated, (req, res) => {
	let userId = req.params.id;
	let {name, verified, admin} = req.body;

	User.update({
		name,
		verified, 
		admin
    }, {
        where: { id: userId }
    }).then(() => {
        res.redirect('/admin/listUsers');
    }).catch(err => console.log(err));

}); 

//FURNITURE - Retrieve furniture
router.get('/retrieveFurniture', ensureAdmin, (req, res) => {
    Furniture.findAll({
        include: [{model: Themes, attributes: ['theme']},
                  {model: Categories, attributes: ['category'], as: 'categories'}],
        order: [
            ['id', 'ASC'] 
        ]
    }).then((furnitures) => {
        Themes.aggregate('theme', 'DISTINCT', { plain: false, order: [["theme", "ASC"]] })
        .then(themes => {
            finalThemes = themes.map(object => object["DISTINCT"]);
            Categories.aggregate('category', 'DISTINCT', { plain: false, order: [["category", "ASC"]] })
            .then(categories => {
                finalCategories = categories.map(object => object["DISTINCT"]);
                
                res.render('admin/retrieveFurniture', {
                    furnitures: furnitures,
                    themes: finalThemes,
                    categories: finalCategories
                });

            }).catch(err => console.log(err))
        }).catch(err => console.log(err))

    }).catch(err => console.log(err));
})

//FURNITURE - add furniture
router.get('/addFurniture', ensureAdmin, (req, res) => {
    Themes.aggregate('theme', 'DISTINCT', { plain: false, order: [["theme", "ASC"]] })
    .then(themes => {
        finalThemes = themes.map(object => object["DISTINCT"]);
        Categories.aggregate('category', 'DISTINCT', { plain: false, order: [["category", "ASC"]] })
        .then(categories => {
            finalCategories = categories.map(object => object["DISTINCT"]);
            res.render('admin/addFurniture', {
                themes: finalThemes,
                categories: finalCategories
            });
        });
    });
});

//FURNITURE - add furniture POST (save)
router.post('/addFurniture', ensureAdmin, (req, res) => {
    let furnitureName = req.body.furnitureName;
    let description = req.body.description;
    let cost = req.body.cost;
    let length = req.body.length;
    let width = req.body.width;
    let height = req.body.height;
    let imageURL = req.body.imageURL;

    let addedBy = req.user.id;
    let lastEditedBy = req.user.id

    // Multi-value components return array of strings or undefined
    Furniture.create({
        furnitureName,
        cost,
        description,
        lengthmm: length,
        widthmm: width,
        heightmm: height,
        imageURL,
        addedBy,
        lastEditedBy
    }) 
    .then(furniture => {

        keys = Object.keys(req.body)
        // Filter themes
        themeList = keys.filter( function(key) {return key.startsWith("Theme:")
        }).map( function(key2) {return key2.substring(key2.indexOf(":") + 1)});
    
        for (indexVal in themeList){
            var themeName = themeList[indexVal];
            Themes.create({
                theme: themeName,
                furnitureId: furniture.id
            })
        }
        //Filter Categories
        categoryList = keys.filter( function(key) {return key.startsWith("Category:")
        }).map( function(key2) {return key2.substring(key2.indexOf(":") + 1)});
    
        for (indexVal in categoryList){
            var categoryName = categoryList[indexVal];
            Categories.create({
                category: categoryName,
                furnitureId: furniture.id
            })
        }

        alertMessage(res, 'success', 'Successfully added furniture '+ furniture.furnitureName +' ID ' + furniture.id+'!', 'fas fa-exclamation-circle', true);
        res.redirect('/admin/retrieveFurniture');
    })
    .catch(err => console.log(err))
});

//FURNITURE - Upload image for add/edit furniture
router.post('/furnitureUpload', ensureAdmin, (req, res) => {
    if (!fs.existsSync('./public/furnitureUploads/')){
        fs.mkdirSync('./public/furnitureUploads/');
    }
    imageUpload(req, res, (err) => {
        if (err) {
            res.json({file: '/img/no-image.jpg', err: err});
        } else {
            if (req.file === undefined) {
                res.json({file: '/img/no-image.jpg', err: err});
            } else {
                res.json({file: `/furnitureUploads/${req.file.filename}`});
            }
        }
    });
})

//FURNITURE - Edit Furniture 
router.get('/editFurniture/:id', ensureAdmin, (req, res) => {
    Furniture.findOne({
        include: [{model: Themes, as: 'themes', attributes: ['theme']},
                    {model: Categories, as: 'categories', attributes: ['category']}],
        where: { id: req.params.id },
    }).then((furniture) => {
        furniture.categories = removeJoinMetaData(furniture.categories)
        furniture.themes = removeJoinMetaData(furniture.themes)
        //Themes and categories section
        Themes.aggregate('theme', 'DISTINCT', { plain: false, order: [["theme", "ASC"]] })
        .then(themes => {
            finalThemes = themes.map(object => object["DISTINCT"]);
            Categories.aggregate('category', 'DISTINCT', { plain: false, order: [["category", "ASC"]] })
            .then(categories => {
                finalCategories = categories.map(object => object["DISTINCT"]);

                res.render('admin/editFurniture', {
                    furniture: furniture,
                    themes: finalThemes,
                    categories: finalCategories
                });

            });
        });
    }).catch(err => console.log(err)); 
});

//FURNITURE - Edit Furniture PUT (save)
router.put('/saveEditFurniture/:id', ensureAdmin, (req, res) => {
    let furnitureName = req.body.furnitureName;
    let description = req.body.description;
    let cost = req.body.cost;
    let length = req.body.length;
    let width = req.body.width;
    let height = req.body.height;
    let imageURL = req.body.imageURL;

    let lastEditedBy = req.user.id;

    Furniture.update({
            furnitureName,
            cost,
            description,
            lengthmm: length,
            widthmm: width,
            heightmm: height,
            imageURL,
            lastEditedBy
        }, {
        where: { id: req.params.id },
        plain: true
    })

    Themes.destroy({  where: { furnitureId: req.params.id } })    
    Categories.destroy({ where: { furnitureId: req.params.id } })

    keys = Object.keys(req.body)
    // Filter themes
    themeList = keys.filter( function(key) {return key.startsWith("Theme:")
    }).map( function(key2) {return key2.substring(key2.indexOf(":") + 1)});

    for (indexVal in themeList){
        var themeName = themeList[indexVal];
        Themes.create({
            theme: themeName,
            furnitureId: req.params.id
        })
    }
    //Filter Categories
    categoryList = keys.filter( function(key) {return key.startsWith("Category:")
    }).map( function(key2) {return key2.substring(key2.indexOf(":") + 1)});

    for (indexVal in categoryList){
        var categoryName = categoryList[indexVal];
        Categories.create({
            category: categoryName,
            furnitureId: req.params.id
        })
    }

    res.redirect('/admin/retrieveFurniture');
}); 

//FURNITURE - Delete Furniture 
router.get('/deleteFurniture/:id', ensureAdmin, (req, res) => {
	Furniture.findOne({
        where: {
            id: req.params.id,
        }
    }).then((furniture) => {
        if (furniture == null){
            //req.logout();
            alertMessage(res, 'danger', 'Furniture does not exist in database', 'fas fa-exclamation-circle', true);
            res.redirect('/admin/retrieveFurniture');
            return
        } else {
            Themes.destroy({ where: {furnitureId: furniture.id}})
            Categories.destroy({ where: {furnitureId: furniture.id}})
            Furniture.destroy({
                where: {
                    id: furniture.id
                }
            }).then((furniture2) =>{ //furniture2 returns int(1) maybe because success boolean?
                alertMessage(res, 'success', 'Successful delete', 'fas fa-exclamation-circle', true);
                res.redirect('/admin/retrieveFurniture');
            })
        }
	});
});

//FEEDBACK - JUN LENG


//FEEDBACK - Answer feedback
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



//TEST
//ensure admin test
router.get('/ensureAdmin', ensureAdmin, (req, res) => {
	alertMessage(res, 'success', 'Ensure Admin works!', 'fas fa-exclamation-circle', true);
	res.redirect('/')
})

//do eventually
router.get('/passwordAgeAdminreset', (req, res) => {
	const title = 'BRANDNAME - Admin - ??';
	res.render('admin/showUsers', {title: title}) 
}); 

module.exports = router;
