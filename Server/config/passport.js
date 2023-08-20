const LocalStratagey = require("passport-local").Strategy;
const User = require("../Models/User");
module.exports = function (passport) {
  passport.use(
    new LocalStratagey(
      { usernameField: "name" },
      (username, password, done) => {
        console.log('using local stratagey');
        User.findOne({ username }).then((user) => {
          const isValid = user.password === password ? true : false;
          console.log(isValid);
          if (isValid) return done(null, user);
          return done(null, false).catch((err) => done(err));
        });
      }
    )
  );

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });
};
