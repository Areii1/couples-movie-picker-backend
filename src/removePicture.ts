export {};

const AWS = require("aws-sdk");
const headers = require("./constants");
const { getRemoveProfilePictureAttributeParams } = require("./functions");

const validateUserInput = (event: any) => {
  if (event.queryStringParameters) {
    if (event.queryStringParameters.username) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

exports.handler = async function (event: any) {
  if (validateUserInput(event)) {
    const dynamodb = new AWS.DynamoDB();
    try {
      const removeProfilePictureAttributeParams = getRemoveProfilePictureAttributeParams(
        process.env.USERS_TABLE_NAME as string,
        event.queryStringParameters.username
      );
      const dbPutResponse = await dynamodb
        .updateItem(removeProfilePictureAttributeParams)
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
        body: "failed to perform database action",
      };
    }
  } else {
    const response = {
      statusCode: 400,
      headers,
      body: 'required query string parameters missing',
    };
    return response;
  }
};
