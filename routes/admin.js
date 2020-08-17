const express = require('express');
const router = express.Router();

//Models
const User = require('../models/User');
const Video = require('../models/Video'); 
const Feedback = require('../models/Feedback');

const Furniture = require('../models/Furniture');
const Themes = require('../models/Themes');
const Categories = require('../models/Categories');
const FurnitureToThemes = require('../models/FurnitureThemes');
const FurnitureToCategories = require('../models/FurnitureCategories');
//Extras
const alertMessage = require('../helpers/messenger');
const {ensureAuthenticated, ensureAdmin} = require('../helpers/auth')

const fs = require('fs');
const {imageUpload, themeImageUpload, categoryImageUpload} = require('../helpers/imageUpload');

const { removeJoinMetaData } = require('../helpers/removeMeta');
const discountCode = require('../models/discountCode');

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
        order: [['id', 'ASC']]
    }).then((furnitures) => {
        Themes.findAll({ 
        }).then(themes => {
            Categories.findAll({
            }).then(categories => {
                
                res.render('admin/retrieveFurniture', {
                    furnitures: furnitures,
                    themes,
                    categories
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
router.post('/addFurniture', ensureAdmin, async (req, res) => {
    let furnitureName = req.body.furnitureName;
    let description = req.body.description;
    let cost = req.body.cost;
    let length = req.body.length;
    let width = req.body.width;
    let height = req.body.height;
    let imageURL = req.body.imageURL;
    let rating = 0;
    let actualrating = 0;

    let addedBy = req.user.id;
    let lastEditedBy = req.user.id

    // Multi-value components return array of strings or undefined
    let createFurniture = await Furniture.create({
        furnitureName,
        cost,
        description,
        lengthmm: length,
        widthmm: width,
        heightmm: height,
        imageURL,
        addedBy,
        lastEditedBy,
        rating,
        actualrating
    }) 
    .then(furniture => { return furniture })

    let themeFindCreate = await function(){
        for (indexVal in themeList){
            var themeName = themeList[indexVal];
            Themes.findOrCreate({
                where: { theme: themeName }
            }).then(theme => {
                furniture.addThemes(theme[0])
            })
        }
    }
    
    let categoryFindCreate = await function(){
        for (indexVal in categoryList){
            var categoryName = categoryList[indexVal];
            Categories.findOrCreate({
                where: { category: categoryName }
            }).then(category => {
                furniture.addCategories(category[0])
            })
        }
    }

    furniture = createFurniture

    keys = Object.keys(req.body)
    // Filter themes
    themeList = keys.filter( function(key) {return key.startsWith("Theme:")
    }).map( function(key2) {return key2.substring(key2.indexOf(":") + 1)});
    //Filter Categories
    categoryList = keys.filter( function(key) {return key.startsWith("Category:")
    }).map( function(key2) {return key2.substring(key2.indexOf(":") + 1)});

    themeFindCreate()
    categoryFindCreate()

    alertMessage(res, 'success', 'Successfully added furniture '+ furniture.furnitureName +' ID ' + furniture.id+'!', 'fas fa-exclamation-circle', true);
    res.redirect('/admin/retrieveFurniture');
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
        Themes.findAll({ attributes: ['id', 'theme'], order: [["theme", "ASC"]] })
        .then(themes => {
            Categories.findAll({ attributes: ['id', 'category'], order: [["category", "ASC"]] })
            .then(categories => {

                res.render('admin/editFurniture', {
                    furniture: furniture,
                    themes: themes,
                    categories: categories
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

    FurnitureToThemes.destroy({  where: { furnitureId: req.params.id } })    
    FurnitureToCategories.destroy({ where: { furnitureId: req.params.id } })

    Furniture.findOne({
        where: {id: req.params.id}
    }).then(furniture => {    
        keys = Object.keys(req.body)
        // Filter themes
        themeList = keys.filter( function(key) {return key.startsWith("Theme:")
        }).map( function(key2) {return key2.substring(key2.indexOf(":") + 1)});
    
        for (indexVal in themeList){
            var themeId = themeList[indexVal];
            Themes.findOne({
                where: { id: themeId }
            }).then(theme => {
                furniture.addThemes(theme)
            })
        }
        
        //Filter Categories
        categoryList = keys.filter( function(key) {return key.startsWith("Category:")
        }).map( function(key2) {return key2.substring(key2.indexOf(":") + 1)});
    
        for (indexVal in categoryList){
            var categoryId = categoryList[indexVal];
            Categories.findOne({
                where: { id: categoryId }
            }).then(category => {
                furniture.addCategories(category)
            })
        }
    
        res.redirect('/admin/retrieveFurniture');
    })

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
            FurnitureToThemes.destroy({ where: {furnitureId: furniture.id} })
            FurnitureToCategories.destroy({ where: {furnitureId: furniture.id} })
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


//THEME - Add Theme
router.get('/addTheme', ensureAdmin, (req, res) => {
    res.render('admin/addTheme', {});
});

//THEME - Add Theme (save)
router.post('/addTheme', ensureAdmin, (req, res) => {
    let themeName = req.body.themeName;
    let themeDescription = req.body.description;
    let imageURL = req.body.imageURL;

    Themes.create({
        theme: themeName,
        themeDescription,
        themeImageURL: imageURL
    }).then(theme => {
        res.redirect('/admin/retrieveFurniture');
    })
});

//THEME - Edit Theme
router.get('/editTheme/:id', ensureAdmin, (req, res) => {
    Themes.findOne({
        where: { id: req.params.id },
    }).then((theme) => {
        res.render('admin/editTheme', {
            theme
        });
    }).catch(err => console.log(err)); 
});

//THEME - Edit Theme PUT (save)
router.put('/saveEditTheme/:id', ensureAdmin, (req, res) => {
    let themeName = req.body.themeName;
    let themeDescription = req.body.description;
    let imageURL = req.body.imageURL;

    Themes.update({
            theme: themeName,
            themeDescription,
            themeImageURL: imageURL
        }, {
        where: { id: req.params.id }
    })

    res.redirect('/admin/retrieveFurniture');
}); 

//THEMES - Upload image for add/edit theme
router.post('/themeUpload', ensureAdmin, (req, res) => {
    if (!fs.existsSync('./public/themeUploads/')){
        fs.mkdirSync('./public/themeUploads/');
    }
    themeImageUpload(req, res, (err) => {
        console.log(err)
        if (err) {
            res.json({file: '/img/no-image.jpg', err: err});
        } else {
            if (req.file === undefined) {
                res.json({file: '/img/no-image.jpg', err: err});
            } else {
                res.json({file: `/themeUploads/${req.file.filename}`});
            }
        }
    });
})

//THEME - Delete Theme
router.get('/deleteTheme/:id', ensureAdmin, (req, res) => {
	Themes.findOne({
        where: {
            id: req.params.id,
        }
    }).then((theme) => {
        if (theme == null){
            alertMessage(res, 'danger', 'Theme does not exist in database', 'fas fa-exclamation-circle', true);
            res.redirect('/admin/retrieveFurniture');
            return
        } else {
            FurnitureToThemes.destroy({ where: {themeId: theme.id}})
            Themes.destroy({ where: {id: theme.id}})
            .then(theme => {
                alertMessage(res, 'success', 'Successful delete', 'fas fa-exclamation-circle', true);
                res.redirect('/admin/retrieveFurniture');
            })
        }
	});
});

//CATEGORY - Add Category
router.get('/addCategory', ensureAdmin, (req, res) => {
    res.render('admin/addCategory', {});
});

//CATEGORY- Add Category (save)
router.post('/addCategory', ensureAdmin, (req, res) => {
    let categoryName = req.body.categoryName;
    let categoryDescription = req.body.description;
    let imageURL = req.body.imageURL;

    Categories.create({
        category: categoryName,
        categoryDescription,
        categoryImageURL: imageURL
    }).then(category => {
        res.redirect('/admin/retrieveFurniture');
    })
});

//Category - Edit Category
router.get('/editCategory/:id', ensureAdmin, (req, res) => {
    Categories.findOne({
        where: { id: req.params.id },
    }).then((category) => {
        res.render('admin/editCategory', {
            category
        });
    }).catch(err => console.log(err)); 
});

//CATEGORY - Edit Category PUT (save)
router.put('/saveEditCategory/:id', ensureAdmin, (req, res) => {
    let categoryName = req.body.categoryName;
    let categoryDescription = req.body.description;
    let imageURL = req.body.imageURL;

    Categories.update({
            category: categoryName,
            categoryDescription,
            categoryImageURL: imageURL
        }, {
        where: { id: req.params.id }
    })

    res.redirect('/admin/retrieveFurniture');
}); 

//CATEGORIES - Upload image for add/edit category
router.post('/categoryUpload', ensureAdmin, (req, res) => {
    if (!fs.existsSync('./public/categoryUploads/')){
        fs.mkdirSync('./public/categoryUploads/');
    }
    categoryImageUpload(req, res, (err) => {
        if (err) {
            res.json({file: '/img/no-image.jpg', err: err});
        } else {
            if (req.file === undefined) {
                res.json({file: '/img/no-image.jpg', err: err});
            } else {
                res.json({file: `/categoryUploads/${req.file.filename}`});
            }
        }
    });
})


//Category - Delete Category
router.get('/deleteCategory/:id', ensureAdmin, (req, res) => {
	Categories.findOne({
        where: {
            id: req.params.id,
        }
    }).then((category) => {
        if (category== null){
            alertMessage(res, 'danger', 'Category does not exist in database', 'fas fa-exclamation-circle', true);
            res.redirect('/admin/retrieveFurniture');
            return
        } else {
            FurnitureToCategories.destroy({ where: {categoryId: category.id}})
            Categories.destroy({ where: {id: category.id}})
            .then(category => {
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


router.get('/discount', ensureAdmin, (req, res) => {
    discountCode.findAll({})
    .then((discounts) => {
        res.render('admin/discountC', {
            discounts: discounts
        });
    })
    .catch(err => console.log(err));
})

router.get('/AddDiscount', ensureAdmin, (req, res) => {
    res.render('admin/AddDiscountC')
})

router.post('/AddDiscount', ensureAdmin, (req, res) => {
    let discountcode = req.body.DiscountC;
    let perDis = req.body.perDis || 0;
    let subDis = req.body.subDis || 0;
    discountCode.findOne({where:{discountcode}})
    .then((code) => {
        if(code){
            alertMessage(res, 'danger', 'Discount Code already exist', 'fas fa-exclamation-circle', true);
            res.redirect('/admin/AddDiscount')
        } else {
            discountCode.create({
                discountcode,
                subDis,
                perDis,
            }) 
            .then(discounts => {
                alertMessage(res, 'success', 'Successfully added Discount Code', 'fas fa-exclamation-circle', true);
                res.redirect('/admin/discount');
            })
        }
    })
    .catch(err => console.log(err))    
})


router.get('/discount/edit/:id', ensureAdmin, (req, res) => {
    discountCode.findOne({
        where: {
            id: req.params.id
        }
    }).then((code) => {
        res.render('admin/EditDiscountC', {
            code
        });
    }).catch(err => console.log(err)); 
});

router.post('/discount/edit/:id', ensureAdmin, (req, res) => {
    let discountcode = req.body.DiscountC;
    let perDis = req.body.perDis;
    let subDis = req.body.subDis;
    
    let id = req.params.id
    discountCode.findOne({where:{discountcode}})
    .then((code) => {
        if(code && code.id != id){
            alertMessage(res, 'danger', 'Discount Code already exist', 'fas fa-exclamation-circle', true);
            res.redirect('/admin/discount/edit/'+id)
        } else {   
            discountCode.update({
                discountcode,
                subDis,
                perDis,
            }, {
                where: {
                    id
                }
            }).then(() => {
                alertMessage(res, 'success', 'Successful update', 'fas fa-exclamation-circle', true);
                res.redirect('/admin/discount');
            })
        }
    })
    .catch(err => console.log(err));
})

router.get('/discount/delete/:id', ensureAdmin, (req, res) => {
	discountCode.findOne({
        where: {
            id: req.params.id
        }
    }).then((code) => {
        discountCode.destroy({
            where: {
                id: code.id
            }
        }).then((address2) =>{ 
            alertMessage(res, 'success', 'Successful delete', 'fas fa-exclamation-circle', true);
            res.redirect('/admin/discount');
        })

	});
});


module.exports = router;
