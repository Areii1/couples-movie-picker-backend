const AWS = require("aws-sdk");
const { validateTriggerInput } = require("./utilityFunctions");
// const { fetchUser } = require("./getUsers");

const requiredAttributes = [{ name: "userName", type: "string" }];

const getPutItemParams = (tableName, item) => ({
  TableName: tableName,
  Item: item,
  ConditionExpression: "attribute_not_exists(username)",
});

exports.handler = async function (event) {
  if (validateTriggerInput(event, requiredAttributes)) {
    const dynamodb = new AWS.DynamoDB();
    const pictureIndex = Math.floor(Math.random() * 22) + 1;
    const modifiedItem = {
      username: { S: event.userName },
      userId: { S: event.request.userAttributes.sub },
      created: { N: `${Date.now()}` },
      // uploaded images to s3 bucket /random, need to recreate these on another initiliazition
      profilePicture: { S: `random/${pictureIndex}.jpg` },
    };
    const putItemParams = getPutItemParams(
      process.env.USERS_TABLE_NAME,
      modifiedItem
    );
    try {
      await dynamodb.putItem(putItemParams).promise();
      // await fetchUser(process.env.USERS_TABLE_NAME as string, event.userName);
      return event;
    } catch (databaseError) {
      console.log(databaseError, "databaseError");
      if (databaseError.code === "ConditionalCheckFailedException") {
        return event;
      } else {
        return event;
      }
    }
  } else {
    return event;
  }
};
