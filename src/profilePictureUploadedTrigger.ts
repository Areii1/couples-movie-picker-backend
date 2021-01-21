const AWS = require("aws-sdk");
const headers = require("./constants");
const { getSetProfilePictureAttributeParams } = require("./functions");

exports.handler = async function (event: any) {
  const keySplitArr = event.Records[0].s3.object.key.split("/");
  const dynamodb = new AWS.DynamoDB();
  const setProfilePictureAttributeParams = getSetProfilePictureAttributeParams(
    process.env.USERS_TABLE_NAME,
    event.requestContext.authorizer.claims["cognito:username"],
    keySplitArr[1]
  );
  try {
    const setProfilePictureAttributeResponse = await dynamodb
      .updateItem(setProfilePictureAttributeParams)
      .promise();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(setProfilePictureAttributeResponse),
    };
  } catch (databaseError) {
    return {
      statusCode: 500,
      headers,
      body: "failed to put item",
    };
  }
};
