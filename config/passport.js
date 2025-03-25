const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/usersSchema");
const { generateReferralCode } = require("../controller/user/referal");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          user = await User.findOneAndUpdate(
            { googleId: profile.id },
            {
              $set: {
                name: profile.displayName,
                email: profile.emails[0].value,
                lastLogin: new Date(),
              },
            },
            { new: true }
          );
          return done(null, user);
        }

        const referralCode = generateReferralCode(
          profile?.name?.givenName,
          profile?.name?.familyName
        );

        const newUser = await User.create({
          googleId: profile.id,
          FirstName: profile.name?.givenName || "", // Extract first name
          LastName: profile.name?.familyName || "", // Extract last name
          email: profile.emails[0].value,
          referralCode,
          profilePicture: profile.photos?.[0]?.value,
          lastLogin: new Date(),
        });

        return done(null, newUser);
      } catch (error) {
        console.error("Google Strategy Error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      return done(new Error("User not found"), null);
    }
    done(null, user);
  } catch (error) {
    console.error("Deserialize Error:", error);
    done(error, null);
  }
});

module.exports = passport;
