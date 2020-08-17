const express = require('express');
const router = express.Router();
const url = require('url');

//models
const Furniture = require('../models/Furniture'); //Models
const Themes = require('../models/Themes');
const Categories = require('../models/Categories');
const Reviews = require('../models/Review');
const Users = require('../models/User')
//extras
const { ensureAuthenticated, ensureAdmin } = require('../helpers/auth')
const alertMessage = require('../helpers/messenger');
const sequelize = require('../config/DBConfig');
const Review = require('../models/Review');
const flashMessage = require('../helpers/messenger');
const moment = require("moment");
const fs = require('fs');
const {reviewImageUpload} = require('../helpers/imageUpload');

router.get('/search', (req, res) => {
    //check if searchInput not null to access page      
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var searchInput = query.searchInput;
    if (searchInput) {
        var searchVals = searchInput.split(" ")
        let conditions = []
        for (var x in searchVals) {
            conditions.push({ //add list of conditions
                furnitureName: {
                    [require("sequelize").Op.substring]: searchVals[x]
                }
            });
        }

        //Use these keys to create conditions to search Furniture for suitable furniture
        var themes = query['themes[]']
        var categories = query['categories[]']
        let themeConditions = []
        if (themes) {
            if (Array.isArray(themes)) {
                for (var x in themes) {
                    themeConditions.push({ theme: themes[x] });
                }
            } else { themeConditions.push({ theme: themes }) }
        }
        let categoryConditions = []
        if (categories) {
            if (Array.isArray(categories)) {
                for (var x in categories) {
                    categoryConditions.push({ category: categories[x] });
                }
            } else { categoryConditions.push({ category: categories }) }
        }

        if (!(themes)) { themes = [] }
        else if (!(Array.isArray(themes))) { themes = [themes] }
        if (!(categories)) { categories = [] }
        else if (!(Array.isArray(categories))) { categories = [categories] }

        //to calculate number of themes and number of categories for possible values
        if (themeConditions.length != 0) { themeConditions = { model: Themes, attributes: ['theme'], where: { [require("sequelize").Op.or]: themeConditions } } }
        else { themeConditions = { model: Themes, attributes: ['theme'] } }
        if (categoryConditions.length != 0) { categoryConditions = { model: Categories, attributes: ['category'], where: { [require("sequelize").Op.or]: categoryConditions } } }
        else { categoryConditions = { model: Categories, attributes: ['category'] } }

        //Sort Order
        var sortOrder = query['order'] || "recent"
        var sortOrderArray = ["recent", "cost-ASC", "cost-DESC", "rating-DESC", "rating-ASC"]
        var sortRES = sortOrder
        if (!(sortOrderArray.includes(sortOrder))) {
            sortOrder = "id-DESC"
        }
        if (sortOrder == "recent") { sortOrder = "id-DESC" }
        sortOrder = sortOrder.split('-')
        console.log("Sort Order: ", sortOrder)

        if (themes.length >= 2 && categories.length == 0) {
            Furniture.findAll({
                include: [themeConditions],
                where: { [require("sequelize").Op.or]: conditions },
                group: ["furniture.id"],
                having: sequelize.where(
                    sequelize.fn('count', sequelize.col('furniture.id')), { [require("sequelize").Op.gte]: themes.length }
                )

            }).then((furnituresId) => {

                let furnitureArray = []
                furnituresId.map(function (object) {
                    furnitureArray.push(object.dataValues.id)
                })
                Furniture.findAll({
                    include: [{ model: Themes, attributes: ['theme'] }, { model: Categories, attributes: ['category'] }],
                    where: { id: { [require("sequelize").Op.in]: furnitureArray } },
                    order: [sortOrder]
                }).then((furnitureArray2) => {
                    //collect array of themes and categories as tags
                    Themes.aggregate('theme', 'DISTINCT', { plain: false, order: [["theme", "ASC"]] })
                        .then(themes2 => {
                            finalThemes = themes2.map(object => object["DISTINCT"]);
                            Categories.aggregate('category', 'DISTINCT', { plain: false, order: [["category", "ASC"]] })
                                .then(categories2 => {
                                    finalCategories = categories2.map(object => object["DISTINCT"]);
                                    //RENDER PAGE
                                    res.render('furniture/listFurniture', {
                                        searchInputEnter: searchInput,
                                        furnitures: furnitureArray2,
                                        themes: finalThemes,
                                        categories: finalCategories,
                                        queryThemes: themes,
                                        queryCategories: categories,
                                        sort: sortRES,
                                        resultsFound: furnitureArray2.length
                                    });

                                })
                        })

                })
            }).catch(err => console.log(err));

        } else if (categories.length >= 2 && themes.length == 0) {
            Furniture.findAll({
                include: [categoryConditions],
                where: { [require("sequelize").Op.or]: conditions },
                group: ["furniture.id"],
                having: sequelize.where(
                    sequelize.fn('count', sequelize.col('furniture.id')), { [require("sequelize").Op.gte]: categories.length }
                )
            }).then((furnituresId) => {
                let furnitureArray = []
                furnituresId.map(function (object) {
                    furnitureArray.push(object.dataValues.id)
                })
                Furniture.findAll({
                    include: [{ model: Themes, attributes: ['theme'] }, { model: Categories, attributes: ['category'] }],
                    where: { id: { [require("sequelize").Op.in]: furnitureArray } },
                    order: [sortOrder]
                }).then((furnitureArray2) => {
                    //collect array of themes and categories as tags
                    Themes.aggregate('theme', 'DISTINCT', { plain: false, order: [["theme", "ASC"]] })
                        .then(themes2 => {
                            finalThemes = themes2.map(object => object["DISTINCT"]);
                            Categories.aggregate('category', 'DISTINCT', { plain: false, order: [["category", "ASC"]] })
                                .then(categories2 => {
                                    finalCategories = categories2.map(object => object["DISTINCT"]);
                                    //RENDER PAGE
                                    res.render('furniture/listFurniture', {
                                        searchInputEnter: searchInput,
                                        furnitures: furnitureArray2,
                                        themes: finalThemes,
                                        categories: finalCategories,
                                        queryThemes: themes,
                                        queryCategories: categories,
                                        sort: sortRES,
                                        resultsFound: furnitureArray2.length
                                    });

                                })
                        })

                })
            }).catch(err => console.log(err));

        } else if (themes.length + categories.length >= 2) {

            countCheck = themes.length * categories.length
            Furniture.findAll({
                include: [themeConditions, categoryConditions],
                where: { [require("sequelize").Op.or]: conditions },
                group: ["furniture.id"],
                having: sequelize.where(
                    sequelize.fn('count', sequelize.col('furniture.id')), { [require("sequelize").Op.gte]: countCheck }
                )
            }).then((furnituresId) => {

                let furnitureArray = []
                furnituresId.map(function (object) {
                    furnitureArray.push(object.dataValues.id)
                })
                Furniture.findAll({
                    include: [{ model: Themes, attributes: ['theme'] }, { model: Categories, attributes: ['category'] }],
                    where: { id: { [require("sequelize").Op.in]: furnitureArray } },
                    order: [sortOrder]
                }).then((furnitureArray2) => {
                    //collect array of themes and categories as tags
                    Themes.aggregate('theme', 'DISTINCT', { plain: false, order: [["theme", "ASC"]] })
                        .then(themes2 => {
                            finalThemes = themes2.map(object => object["DISTINCT"]);
                            Categories.aggregate('category', 'DISTINCT', { plain: false, order: [["category", "ASC"]] })
                                .then(categories2 => {
                                    finalCategories = categories2.map(object => object["DISTINCT"]);
                                    //RENDER PAGE
                                    res.render('furniture/listFurniture', {
                                        searchInputEnter: searchInput,
                                        furnitures: furnitureArray2,
                                        themes: finalThemes,
                                        categories: finalCategories,
                                        queryThemes: themes,
                                        queryCategories: categories,
                                        sort: sortRES,
                                        resultsFound: furnitureArray2.length
                                    });

                                })
                        })

                })
            }).catch(err => console.log(err));
        } else { //if 1 or less conditions

            Furniture.findAll({
                include: [themeConditions, categoryConditions],
                where: { [require("sequelize").Op.or]: conditions },
                group: ["furniture.id"]
            }).then((furnituresId) => {
                let furnitureArray = []
                furnituresId.map(function (object) {
                    furnitureArray.push(object.dataValues.id)
                })
                Furniture.findAll({
                    include: [{ model: Themes, attributes: ['theme'] }, { model: Categories, attributes: ['category'] }],
                    where: { id: { [require("sequelize").Op.in]: furnitureArray } },
                    order: [sortOrder]
                }).then((furnitureArray2) => {
                    //collect array of themes and categories as tags

                    Themes.aggregate('theme', 'DISTINCT', { plain: false, order: [["theme", "ASC"]] })
                        .then(themes2 => {
                            finalThemes = themes2.map(object => object["DISTINCT"]);
                            Categories.aggregate('category', 'DISTINCT', { plain: false, order: [["category", "ASC"]] })
                                .then(categories2 => {
                                    finalCategories = categories2.map(object => object["DISTINCT"]);

                                    //RENDER PAGE
                                    res.render('furniture/listFurniture', {
                                        searchInputEnter: searchInput,
                                        furnitures: furnitureArray2,
                                        themes: finalThemes,
                                        categories: finalCategories,
                                        queryThemes: themes,
                                        queryCategories: categories,
                                        sort: sortRES,
                                        resultsFound: furnitureArray2.length
                                    });

                                })
                        })
                }).catch(err => console.log(err));
            }).catch(err => console.log(err));
        }


    } else {
        alertMessage(res, 'info', 'Enter something in the search bar', 'fas fa-exclamation-circle', true);
        res.redirect('/');
    }
});


router.get('/item/:id', (req, res) => {
    Furniture.findOne({
        where: { id: req.params.id },
        include: [{model: Themes, attributes: ['theme'] }, { model: Categories, attributes: ['category'] }, {model: Review}],
    }).then(item => {
        if (item) {
            //to display all reviews
            Review.findAll({
                include: {model: Users, attributes: ['name']},
                where: { furnitureId: item.id }
            }).then(review=> {
                let reviewtotal = 0;
                let actualtotal = 0;
                if (reviewtotal.length != 0) {
                    review.forEach(obj => {
                        reviewtotal += obj.dataValues.rating;
                        obj.dataValues.time = moment(obj.dataValues.time).format('Do MMMM YYYY h:mm A');
                    });
                    actualtotal = Math.round(reviewtotal/review.length * 10)/10
                    reviewtotal = Math.floor(reviewtotal/review.length)
                }
                res.render('furniture/furnitureItem', {
                    furniture: item,
                    review: review,
                    reviewtotal: reviewtotal,
                    actualtotal: actualtotal,
                    reviewLength: review.length,
                })
        });

        } else {
            res.redirect('/')
        }
    })
});


router.post('/item/reviewSubmit/:furnitureId', (req, res) => {
    let date_ob = new Date();
    let { star, reviewText, imageURL } = req.body;
    let furnitureId = req.params.furnitureId;
    let userId = req.user.id;
    Review.create({
        reviewText,
        rating: star,
        imageURL,
        time: date_ob,
        furnitureId,
        userId,
    }).then(() => {
        Review.findAll({
            include: {model: Users, attributes: ['name']},
            where: { furnitureId: req.params.furnitureId }
        }).then(review=> {
            let reviewtotal = 0;
            review.forEach(obj => {
                reviewtotal += obj.dataValues.rating;
            });
            reviewtotal = Math.round(reviewtotal/review.length * 10) / 10;
            Furniture.update({
                rating: reviewtotal
            }, {
                where:{ id:req.params.furnitureId },
                plain: true
            })
            res.redirect('/furniture/item/' + req.params.furnitureId)
        })
    })
})

//REVIEWS - Upload image for add/edit review
router.post('/reviewUpload', ensureAdmin, (req, res) => {
    if (!fs.existsSync('./public/reviewUploads/')){
        fs.mkdirSync('./public/reviewUploads/');
    }
    reviewImageUpload(req, res, (err) => {
        if (err) {
            res.json({file: '/img/no-image.jpg', err: err});
        } else {
            if (req.file === undefined) {
                res.json({file: '/img/no-image.jpg', err: err});
            } else {
                res.json({file: `/reviewUploads/${req.file.filename}`});
            }
        }
    });
})

router.get('/themes', (req, res) => {
    Themes.findAll({ 
        order: [["theme", "ASC"]]
    }).then(themes => {
        res.render('furniture/themes', { themes })
    })

})

router.get('/themes/:name', (req, res) => {
    var themeName = req.params.name

    Furniture.findAll({   
        where: {
            '$Themes.theme$': themeName
        },
        include: [{model: Themes, attributes: ['theme']}, { model: Categories, attributes: ['category'] }, {model: Review}],
    }).then(furnitures => {
        Themes.findOne({
            where: { theme: themeName }
        }).then(theme => {
            if (theme == null){
                alertMessage(res, 'info', 'Theme does not exist! Click one below.', 'fas fa-exclamation-circle', true);
                res.redirect('/furniture/themes')
            } else {
                res.render('furniture/themesDetailed', {
                    furnitures,
                    theme
                })
            }
        })
    })

})

router.get('/categories', (req, res) => {
    Categories.findAll({ 
        order: [["category", "ASC"]]
    }).then(categories => {
        res.render('furniture/categories', { categories })
    })

})

router.get('/categories/:name', (req, res) => {
    var categoryName = req.params.name

    Furniture.findAll({   
        where: {
            '$Categories.category$': categoryName
        },
        include: [{model: Themes, attributes: ['theme']}, { model: Categories, attributes: ['category'] }, {model: Review}],
    }).then(furnitures => {
        Categories.findOne({
            where: { category: categoryName }
        }).then(category => {
            if (category == null){
                alertMessage(res, 'info', 'Category does not exist! Click one below', 'fas fa-exclamation-circle', true);
                res.redirect('/furniture/categories')
            } else {
                res.render('furniture/categoriesDetailed', { 
                    furnitures,
                    category
                })
            }
        })
    })

})

module.exports = router;