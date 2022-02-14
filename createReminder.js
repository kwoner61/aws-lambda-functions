var aws = require("aws-sdk");
aws.config.update({ region: "us-east-1" });

exports.handler = async (event) => {

  let cwevents = new aws.CloudWatchEvents({ apiVersion: '2015-10-07' });
  let requestBody = JSON.parse(event.body);
  let response = { createdRuleArn: "", allTargetsCreated: false };

  let ruleParams = {
    Name: "RemindMeInEvent_" + (Math.random() + "").substring(2, 7) + requestBody.requestId,
    Description: requestBody.description || "Remind me in x",
    ScheduleExpression: requestBody.cronExpression,
    State: "ENABLED",
    Tags: [{ Key: 'billing', Value: 'remindmein' }]
  };

  let ruleTargetParams = {
    Rule: ruleParams.Name,
    Targets: [{
      Id: 'default',
      Arn: 'arn:aws:lambda:us-east-1:644200607727:function:sendEmail',
      Input: JSON.stringify({ toEmailAddress: requestBody.toEmailAddress, emailContent: requestBody.reminderContent, ruleName: ruleParams.Name })
    }]
  };

  await cwevents.putRule(ruleParams).promise().then(
    data => {
      response.createdRuleArn = data.RuleArn;
    },
    err => {
      console.log(err);
    });
    
  await cwevents.putTargets(ruleTargetParams).promise().then(
    data => {
      if (data.FailedEntryCount < 1) response.allTargetsCreated = true;
    },
    err => {
      console.log(err);
    });
    
  return response;
};
