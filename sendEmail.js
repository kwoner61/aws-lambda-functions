var aws = require("aws-sdk");
var ses = new aws.SES({ region: "us-east-1" });
var cwevents = new aws.CloudWatchEvents({ apiVersion: '2015-10-07' });

exports.handler = async (event) => {

  let date_ob = new Date();
  let date = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();

  let ruleName = event.ruleName;
  let targetsToDelete = [];
  let response = { reminderSent: false, reminderRemoved: false };

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

  // Delete the reminder after sucessfully sending out email
  await ses.sendEmail(params).promise().then(
    data => {
      response.messageId = data.MessageId;
      response.reminderSent = true;
    },
    err => {
      console.log(err);
    });

  if (response.reminderSent) {
    await cwevents.listTargetsByRule({ Rule: ruleName }).promise().then(
      data => {
        for (let j in data.Targets) {
          targetsToDelete.push(data.Targets[j].Id);
        }
      },
      err => {
        console.log(err);
      });

    if (targetsToDelete.length > 0) {
      await cwevents.removeTargets({ Rule: ruleName, Ids: targetsToDelete }).promise().then(
        data => {},
        err => {
          console.log(err);
        });
    }

    await cwevents.deleteRule({ Name: ruleName }).promise().then(
      data => {
        response.reminderRemoved = true;
      },
      err => {
        console.log(err);
      });
  }
  
  return response;
};
