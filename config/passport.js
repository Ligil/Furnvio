const LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const bcrypt = require('bcryptjs');
// Load user model
const User = require('../models/User');
function localStrategy(passport){ //somehow takes all the data from /user/login req? to use email and password
    passport.use(new LocalStrategy({usernameField: 'email'}, (email, password, done) => {
        console.log("HELLO: ", email, password)
        User.findOne({ where: {email: email} })
        .then(user => {
            if(!user) {
                return done(null, false, {message: 'No User Found'});
            }
            if(user.verified == 0){
                return done(null, false, {message: 'User not verified'})
            }
            if(user.googleId != null){
                return done(null, false, {message: 'Log in using Google'})
            }

            // Match password
            bcrypt.compare(password, user.password, (err, isMatch) => {
                //if(err) {throw err};
                if(isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, {message: 'Password incorrect'});
                }
            })
        })
    }));
    // Serializes (stores) user id into session upon successful
    // authentication
    passport.serializeUser((user, done) => {
        done(null, user.id); // user.id is used to identify authenticated user
    });
    // User object is retrieved by userId from session and
    // put into req.user
    passport.deserializeUser((userId, done) => {
        User.findByPk(userId)
        .then((user) => {
            done(null, user); // user object saved in req.session
        })
        .catch((done) => { // No user found, not stored in req.session
            console.log(done);
        });
    });
}

function googleStrategy(passport){
    passport.use(new GoogleStrategy({
        clientID: '12529577175-9etb3bb3c1rbosh3j73ega2kist2ob1v.apps.googleusercontent.com',
        clientSecret: 'Kg4foCvXYSqQfuAnGtklE6RH',
        callbackURL: "http://localhost:5000/auth/google/callback"
    },  //AIzaSyB3wrj_IfbqI_w2dWEcRKmiwDYCyFNBzPQ
    function(accessToken, refreshToken, profile, done) {
        console.log("Person clicked, doing stuff now")
        //console.log(profile) //can use profile.name.familyName, profile.name.givenName, displayName, photos?
        User.findOrCreate({ 
            where: {
                name: profile.displayName,
                email: profile.emails[0].value,
                verified: 1,
                admin: false,
                googleId: profile.id
            }
        }).then((err, user) => {
            return done(user, err); //idk why this one is diff compared to local
        })
    }
    ));
    // Serializes (stores) user id into session upon successful
    // authentication
    passport.serializeUser((user, done) => {
        done(null, user[0].id); // user[0].id is used to identify authenticated user, [0] is because we use findOrCreate, instead of findOne, returning array
    });
    // User object is retrieved by userId from session and
    // put into req.user
    passport.deserializeUser((userId, done) => {
        User.findByPk(userId)
        .then((user) => {
            done(null, user); // user object saved in req.session
        })
        .catch((done) => { // No user found, not stored in req.session
            console.log(done);
        });
    });
}                       


module.exports = {localStrategy, googleStrategy};
