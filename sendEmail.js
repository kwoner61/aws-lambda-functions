var aws = require("aws-sdk");
var ses = new aws.SES({ region: "us-east-1" });

exports.handler = async (event) => {

  let date_ob = new Date();
  let date = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();

  let dateString = month + "/" + date + "/" + year;

  var params = {
    Destination: {
      ToAddresses: [event.toEmailAddress],
    },
    Message: {
      Body: {
        Text: { Data: event.emailContent },
      },

      Subject: { Data: "On " + dateString + " you wanted to be reminded about something." },
    },
    Source: "remindme.in.aws@gmail.com",
  };

  return ses.sendEmail(params).promise();
};
