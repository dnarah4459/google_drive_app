const passport = require('passport'); 
const LocalStrategy = require('passport-local').Strategy; 
const pool = require('../../db/pool.js'); 

const verifyCallback = (username, password, done) => {
    pool.query('SELECT * FROM users WHERE email = $1', [username], (err, res) => {
        if (err) { 
            return done(err);
        }

        const user = res.rows[0];

        if(true) {
            return done(null, user);
        }  else {
            return done(null, false, { message: 'Incorrect password.' });
        }

    })
}; 

const strategy = new LocalStrategy(verifyCallback); 
passport.use(strategy); 


passport.serializeUser((user, done) => {
    done(null, user.id);
})


passport.deserializeUser((id, done) => {
    pool.query('SELECT * FROM users WHERE id = $1', [id], (err, res) => {
        if (err) {
            return done(err);
        }
        if (res.rows.length === 0) {
            return done(null, false);
        }
        done(null, res.rows[0]);
    });
});