var aws = require("aws-sdk");
aws.config.update({ region: "us-east-1" });

exports.handler = async (event) => {

  var cwevents = new aws.CloudWatchEvents({ apiVersion: '2015-10-07' });

  let targetsToDelete = [];
  let rulesToDelete = [];
  let deletedRules = [];
  let response = { rulesDeleted: deletedRules };

  var listRulesParams = {
    "NamePrefix": "RemindMeInEvent_"
  };

  await cwevents.listRules(listRulesParams).promise().then(
    data => {
      rulesToDelete = data.Rules.map(r => r.Name);
    },
    err => {
      console.log(err);
    });

  for (let i in rulesToDelete) {
    const ruleName = rulesToDelete[i];
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
      targetsToDelete = [];
    }

    await cwevents.deleteRule({ Name: ruleName }).promise().then(
      data => {
        deletedRules.push(ruleName);
      },
      err => {
        console.log(err);
      });
  }

  return response;

};
