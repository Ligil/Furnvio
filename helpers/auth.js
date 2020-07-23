//Models
const User = require('../models/User');
//extras
const alertMessage = require('./messenger'); // Bring in alert messenger

const ensureAuthenticated = (req, res, next) => {
    if(req.isAuthenticated()) { // If user is authenticated
        return next(); // Calling next() to proceed to the next statement
    }
    // If not authenticated, show alert message and redirect to ‘/’
    alertMessage(res, 'success', 'Access Denied, Please login first', 'fas fa-exclamation-circle', true);
    res.redirect('/user/login');
};


const ensureAdmin = (req, res, next) => {
    if(req.isAuthenticated()) { // If user is admin
        if (req.user.admin){
            return next(); // Calling next() to proceed to the next statement
        }
    }
    // If not admin, show alert message and redirect to ‘/’
    alertMessage(res, 'danger', 'Access Denied', 'fas fa-exclamation-circle', true);
    res.redirect('/');
};

module.exports = {ensureAuthenticated, ensureAdmin}