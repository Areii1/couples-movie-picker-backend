const AWS = require("aws-sdk");
const headers = require("./constants");
const { getSetProfilePictureAttributeParams } = require("./functions");

exports.handler = async function (event) {
  const pictureIndex = Math.floor(Math.random() * 22) + 1;
  const dynamodb = new AWS.DynamoDB();
  const setProfilePictureAttributeParams = getSetProfilePictureAttributeParams(
    process.env.USERS_TABLE_NAME,
    event.requestContext.authorizer.claims["cognito:username"],
    `random/${pictureIndex}.jpg`
  );
  try {
    const dbPutResponse = await dynamodb
      .updateItem(setProfilePictureAttributeParams)
      .promise();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(dbPutResponse),
    };
  } catch (databaseError) {
    return {
      statusCode: 500,
      headers,
      body: "failed to put item",
    };
  }
};
