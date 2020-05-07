const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "lee311811@naver.com",
    subject: "Thaks for joining in!",
    text: `Welcome to the App, ${name}. Let me know how you get along with the app.`,
    // html: 가능
  });
};

const SendcancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "lee311811@naver.com",
    subject: "Thanks for use",
    text: `Goodbye to ${name}. Let me know why you cancel the app.`,
  });
};

module.exports = {
  sendWelcomeEmail,
  SendcancelationEmail,
};
