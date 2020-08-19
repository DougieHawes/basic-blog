const router = require("express").Router();

const sgMail = require("@sendgrid/mail");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.get("/", (req, res) => {
  res.json({ msg: "auth route" });
});

router.post("/", (req, res) => {
  const { username, email, password } = req.body;

  User.findOne({ email }).exec((err, user) => {
    if (user) {
      return res.status(400).json({
        error: "Email is taken",
      });
    }

    const token = jwt.sign(
      { username, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "10m" }
    );

    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Account activation link`,
      html: `
                <h1>Please use the following link to activate your account</h1>
                <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
                <hr />
                <p>This email may contain sensitive information</p>
                <p>${process.env.CLIENT_URL}</p>
            `,
    };

    sgMail
      .send(emailData)
      .then((sent) => {
        return res.json({
          message: `Email has been sent to ${email}. Follow the instruction to activate your account`,
        });
      })
      .catch((err) => {
        return res.json({
          msg: err.message,
        });
      });
  });
});

router.post("/activation", (req, res) => {
  const { token } = req.body;

  if (token) {
    jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, (err) => {
      if (err) {
        console.log("JWT VERIFY IN ACCOUNT ACTIVATION ERROR");
        return res.status(401).json({
          msg: "expired link",
        });
      }

      const { username, email, password } = jwt.decode(token);

      const user = new User({ username, email, password });

      user.save((err, user) => {
        if (err) {
          console.log("SAVE USER IN ACCOUNT ACTIVATION", ERR);
          return res.status(404).json({
            error: "error saving user in database",
          });
        }
        return res.json({ msg: "signup success" });
      });
    });
  } else {
    return res.json({ msg: "something went wrong" });
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      msg: "user with that email does not exist",
    });
  }

  if (user.password !== password) {
    return res.status(400).json({
      msg: "invalid password",
    });
  }

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  const { _id, username } = user;

  return res.json({
    token,
    user: { _id, username, email },
  });
});

module.exports = router;
