const express = require('express');
const router = express.Router();

//Models
const User = require('../models/User');

//extras
const alertMessage = require('../helpers/messenger');
//bcrypt exercise 1
const bcrypt = require('bcryptjs');
const passport = require('passport');

const { ensureAuthenticated, ensureAdmin } = require('../helpers/auth')
// SendGrid
const sgMail = require('@sendgrid/mail');
// JWT JSON Web Token
const jwt = require('jsonwebtoken');

router.get('/login', (req, res) => {
	const title = 'FURNVIO - Login';
	res.render('user/login', {title: title}) // renders views/login.handlebars
}); 

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/', // Route to homepage
        failureRedirect: '/user/login', // Route to /login URL
        failureFlash: true
        /* Setting the failureFlash option to true instructs Passport to flash an error message using the
        message given by the strategy's verify callback, if any. When a failure occur passport passes the message
        object as error */
    })(req, res, next);
});

router.get('/profile', ensureAuthenticated, (req, res) => {
	const title = 'FURNVIO - Profile';
    User.findOne({ where: {id: req.user.id} })
    .then(user => {
        res.render('user/profile', {title: title, user: user}) // renders views/profile.handlebars
    })
}); 

router.post('/changePassword', ensureAuthenticated, (req, res) => {
    let {existingPassword, newPassword1, newPassword2} = req.body;
    if(newPassword1 !== newPassword2) {
        alertMessage(res, 'danger', 'New Password does not match!', 'fas faexclamation-circle', true);
        res.redirect('/user/changePassword');
    }else if (existingPassword.length < 4 || newPassword1.length < 4 || newPassword2.length < 4) {
        alertMessage(res, 'danger', 'Password length must be more than 4 characters!', 'fas faexclamation-circle', true);
        res.redirect('/user/changePassword');
    }else{
        User.findOne({ where: {id: req.user.id} })
        .then(user => {
            if (user == null){
                console.log('ERRORUSER111 - User no longer exists')
                alertMessage(res, 'danger', 'User ID no longer exists in database, please send resend email or contact staff for help', 'fas faexclamation-circle', true);
                res.redirect('/');
            }else{
                //if user exists
                bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(newPassword1, salt, function(err, hashedPassword) {
                        User.update({password: hashedPassword, passwordResetToken:''}, { //right token for the right account
                            where: {id: user.id}
                        })
                        alertMessage(res, 'success', 'Password reset! Please try to login', 'fas fa-sign-in-alt', true);
                        res.redirect('/user/profile')
                    });
                });
            }
        })
    }
})

router.get('/register', (req, res) => {
	const title = 'FURNVIO - Register';
	res.render('user/register', {title: title}) // renders views/register.handlebars
});

// User register URL using HTTP post => /user/register
router.post('/register', (req, res) => {
    let errors = [];
    // Retrieves fields from register page from request body
    let {name, email, password, password2} = req.body;
    // Checks if both passwords entered are the same
    if(password !== password2) {
        errors.push({text: 'Passwords do not match'});
    }
    // Checks that password length is more than 4
    if(password.length < 4) {
        errors.push({text: 'Password must be at least 4 characters'});
    }
    if (errors.length > 0) { //reloads register page since there is an error, will pop up on load
        res.render('user/register', {
            errors,
            name,
            email,
            password,
            password2
        });
    } else {
        // If all is well, checks if user is already registered
        User.findOne({ where: {email: req.body.email} })
        .then(user => {
            if (user) {
                // If user is found, that means email has already been registered
                res.render('user/register', {
                    error: user.email + ' already registered',
                    name,
                    email,
                    password,
                    password2
                });
            } else {
                let token;
                jwt.sign({'email': email}, '0wOs34ARuWhY1',(err, jwtoken) => { //uses email and key for, jwtoken is the resulting token
                    if (err) console.log('ERRORUSER107 - Error generating Token when registering: ' + err);
                    token = jwtoken; //token variable saves jwtoken
                });

                //hash password
                bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(password, salt, function(err, password) {
                        // Store hash in your password DB.
                        // Create new user record
                        
                        User.create({ name, email, password, verified: 0, admin: false })
                        .then(user => { // Send email after user is inserted into DB

                            sendVerificationEmail(user.id, user.email, token) // send verification email
                            .then(msg => { // Send email success
                                alertMessage(res, 'success', user.name + ' added. Please logon to ' + user.email + ' to verify account.', 'fas fa-sign-in-alt', true);
                                res.redirect('/user/login');
                            }).catch(err => { // Send email fail
                                console.log('ERRORUSER106 - '+err)
                                alertMessage(res, 'warning', 'Error sending to ' + user.email, 'fas fa-sign-in-alt', true);
                                res.redirect('/');
                            });

                        }).catch(err => console.log(err));

                    });
                });

            }
        });
    }
});


function sendVerificationEmail(userId, email, token){
    sgMail.setApiKey('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');
    console.log('Sending email')
    var htmlText = "Thank you registering with FURNVIO.<br><br> Please click <a href='http://localhost:5000/user/verify/" + userId + "/" + token +"'> <strong>here</strong></a> to verify your account."
    const message = {
        to: email,
        from: "191885T@mymail.nyp.edu.sg",
        subject: "Verify FURNVIO Account",
        text: "FURNVIO Email Verification",
        html: htmlText
    };
    // Returns the promise from SendGrid to the calling function
    return new Promise((resolve, reject) => {
        sgMail.send(message)
        .then(msg => resolve(msg))
        .catch(err => reject(err));
    });
}   

//On account creation, receive a sendgrid-modified link which links to this format
router.get('/verify/:userId/:token', (req, res, next) => {
    var userId = req.query.userId
    console.log('verifying ' + userId)
    // retrieve from user using id
    User.findOne({
        where: {
            id: req.params.userId
        }
    }).then(user => {
        console.log(user)
        if (user) { // If user is found
            let userEmail = user.email; // Store email in temporary variable
            if (user.verified === true) { // Checks if user has been verified
                alertMessage(res, 'info', 'User already verified', 'fas faexclamation-circle', true);
                res.redirect('/user/login');
            } else {
            // Verify JWT token sent via URL
            jwt.verify(req.params.token, '0wOs34ARuWhY1', (err, authData) => { //L: Use different token keys for different functions, just in case as generated tokens can be reused regardless of server, if they guess your key, hackers might be able to do bad stuff
                if (err) {
                    console.log('ERRORUSER106 - Invalid token use for email verification ' + user.email)
                    alertMessage(res, 'danger', 'Invalid Token, please send resend email or contact staff for help', 'fas faexclamation-circle', true);
                    res.redirect('/');
                } else {
                    //L: if it is a valid token, regardless of where the token came from
                    User.update({verified: 1}, { 
                        where: {id: user.id}
                    }).then(user => {
                        alertMessage(res, 'success', userEmail + ' verified. Please login', 'fas fa-sign-in-alt', true);
                        res.redirect('/user/login');
                    });
                }
            });
            }
        } else {
            console.log('ERRORUSER105 - Unable to find email when verifying')
            alertMessage(res, 'danger', 'User no longer found in database, please contact staff for help', 'fas fa-exclamationcircle', true);
            res.redirect('/');
        }

    });
});
    

router.get('/forgotPassword', (req, res) => {
	const title = 'FURNVIO - Login';
	res.render('user/forgotPassword', {title: title}) 
}); 

router.post('/forgotPassword', (req, res) => {
    User.findOne({ where: {email: req.body.email} })
    .then(user => {
        if(user == null) {
	        alertMessage(res, 'danger','There is no registered account with this email', 'fas fa-exclamation-circle', false);
            res.redirect('forgotPassword');
        } else if (user.verified == false){
            alertMessage(res, 'danger','This account is not verified, please contact staff to reset your password', 'fas fa-exclamation-circle', false);
            res.redirect('forgotPassword');
        } else {
            let token;
            jwt.sign({'userId': user.id}, '0wOs34ARuWhYpassresetT0k', {expiresIn:60*15},(err, jwtoken) => { //uses email and key for, jwtoken is the resulting token
                if (err) console.log('ERRORUSER104 - issue generating Token: ' + err);
                else {
                    token = jwtoken; //token variable saves jwtoken

                    sendForgotPasswordEmail(user.email, token)
                    .then(msg => { // Send email success
                        bcrypt.genSalt(10, function(err, salt) {
                            bcrypt.hash(token, salt, function(err, hashedToken) {
                                User.update({passwordResetToken: hashedToken}, { //right token for the right account
                                    where: {id: user.id}
                                })
                            });
                        });
                        alertMessage(res, 'success', 'Forgot Password email has been sent, please check your email', 'fas fa-sign-in-alt', true);
                        res.redirect('login');
                    }).catch(err => { // Send email fail
                        console.log('ERRORUSER103 - '+err )
                        alertMessage(res, 'warning', 'Error sending to ' + user.email + ', please contact staff to reset your password', 'fas fa-sign-in-alt', true);
                        res.redirect('forgotPassword');
                    });

                }
            });
        }
    })
});

//MUSTDO
function sendForgotPasswordEmail(email, token){
    sgMail.setApiKey('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');
    console.log('Sending email')
    var htmlText = "To reset your FURNVIO account password click on the following link. <br>Please note that reset link will expire in 48 hours. <br>If you didn't issue a password reset you can safely ignore this email. <br><a href='http://localhost:5000/user/passwordReset/" + token +"'> <strong>reset</strong></a>"
    const message = {
        to: email,
        from: "191885T@mymail.nyp.edu.sg",
        subject: "Requested Password Reset - FURNVIO Account",
        text: "FURNVIO Forget Password",
        html: htmlText
    };
    // Returns the promise from SendGrid to the calling function
    return new Promise((resolve, reject) => {
        sgMail.send(message)
        .then(msg => resolve(msg))
        .catch(err => reject(err));
    });
}   

router.get('/passwordReset/:token', (req, res, next) => {
    let token = req.params.token

    //verify if valid token
    jwt.verify(token, '0wOs34ARuWhYpassresetT0k', (err, authData) => { //L: Use different token keys for different functions, just in case as generated tokens can be reused regardless of server, if they guess your key, hackers might be able to do bad stuff
        if (err) {
            console.log('ERRORUSER110 - Invalid token use for resetting password ' + user.email)
            alertMessage(res, 'danger', 'Invalid Token, please send resend email or contact staff for help', 'fas faexclamation-circle', true);
            res.redirect('/');
        } else {

            let userId = authData.userId
            //check if id stored in token even exists
            User.findOne({ where: {id: userId} })
            .then(user => {
                if (user == null){
                    console.log('ERRORUSER108 - No such email')
                    alertMessage(res, 'danger', 'User ID no longer exists in database, please send resend email or contact staff for help', 'fas faexclamation-circle', true);
                    res.redirect('/');
                } else {
                    let userToken = user.passwordResetToken;
                    //verify if same hashed token as stored
                    bcrypt.compare(token, userToken, (err, isMatch) => {
                        if(isMatch) {
        
                            console.log('You did it!')
                            const title = 'FURNVIO - Reset Password'
                            res.render('user/passwordReset', {title: title}) 
        
                        } else {
                            console.log('ERRORUSER109 - Invalid matching token for ' + user.email)
                            alertMessage(res, 'danger', 'Invalid token, please resend email or contact staff for help', 'fas faexclamation-circle', true);
                            res.redirect('/');
                        }
                    })
                }
            });

        }
    })

});

router.post('/passwordReset/:token', (req, res, next) => {
    let token = req.params.token
    let {password, password2} = req.body;
    if(password !== password2) {
        alertMessage(res, 'danger', 'Password does not match!', 'fas faexclamation-circle', true);
        res.redirect('/user/passwordReset/'+token);
    }else if (password.length < 4) {
        alertMessage(res, 'danger', 'Password length must be more than 4 characters!', 'fas faexclamation-circle', true);
        res.redirect('/user/passwordReset/'+token);
    }else{
        //valid typed password
        jwt.verify(token, '0wOs34ARuWhYpassresetT0k', (err, authData) => { //L: Use different token keys for different functions, just in case as generated tokens can be reused regardless of server, if they guess your key, hackers might be able to do bad stuff
            if (err) {
                console.log('ERRORUSER110 - Invalid token use for resetting password')
                alertMessage(res, 'danger', 'Token has expired, please send resend email and try again', 'fas faexclamation-circle', true);
                res.redirect('/');
            } else {
                //verify user
                userId = authData.userId
                User.findOne({ where: {id: userId} })
                .then(user => {
                    if (user == null){
                        console.log('ERRORUSER111 - User no longer exists')
                        alertMessage(res, 'danger', 'User ID no longer exists in database, please send resend email or contact staff for help', 'fas faexclamation-circle', true);
                        res.redirect('/');
                    }else{
                        //if user exists
                        //salthash password
                        bcrypt.genSalt(10, function(err, salt) {
                            bcrypt.hash(password, salt, function(err, hashedPassword) {
                                User.update({password: hashedPassword, passwordResetToken:''}, { //right token for the right account
                                    where: {id: user.id}
                                })
                                alertMessage(res, 'success', 'Password reset! Please try to login', 'fas fa-sign-in-alt', true);
                                res.redirect('/')
                            });
                        });
                    }
                })
            };
        })
    }
});

module.exports = router;