const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();

// View engine setup
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

// Static folder
app.use("/public", express.static(path.join(__dirname, "public")));

// Body parser middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// async..await is not allowed in global scope, must use a wrapper
async function mailer(output) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `"Nodemailer Contact Form" <${testAccount.user}>`, // sender address
    to: "testmail@example.com", // list of receivers
    subject: "Node Contact Request", // Subject line
    text: "HTML message from nodemailer", // plain text body
    html: output, // html body
  });

  const mailres = {
    status: `Email has been sent from ${info.messageId}`,
    previewUrl: nodemailer.getTestMessageUrl(info),
  }

  return mailres;
}

app.get("/", (req, res) => {
  res.render("contact", { layout: false });
});

app.post("/send", (req, res) => {
  const output = `
        <p>You have a new contact request</p>
        <h3>Contact details</h3>
        <ul>
            <li>Name: ${req.body.name}</li>
            <li>Company: ${req.body.company}</li>
            <li>Email: ${req.body.email}</li>
            <li>Phone: ${req.body.phone}</li>
        </ul>
        <h3>Message</h3>
        <p>${req.body.message}</p>
    `;
  mailer(output)
    .then((response) => {
      res.render("contact", { msg: response, layout: false });
    })
    .catch(console.error);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started at port: ${PORT}`);
});
