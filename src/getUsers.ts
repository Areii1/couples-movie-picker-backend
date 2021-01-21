export {};

const AWS = require("aws-sdk");
const headers = require("./constants");
const { getFetchUserParams } = require("./functions");

const getErrorMessage = (event: any) => {
  if (event.queryStringParameters) {
    if (event.queryStringParameters.username) {
      if (Object.keys(event.queryStringParameters).length === 1) {
        return true;
      } else {
        return "extra query string parameters found, provide only an username";
      }
    } else {
      return "username missing";
    }
  } else {
    return "query string parameters missing";
  }
};

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

const fetchUser = async (tableName: string, givenUsername: string) => {
  const fetchUserParams = getFetchUserParams(tableName, givenUsername);
  try {
    const dynamodb = new AWS.DynamoDB();
    const databaseGetResponse = await dynamodb
      .getItem(fetchUserParams)
      .promise();
    if (Object.keys(databaseGetResponse).length === 0) {
      const response = {
        statusCode: 400,
        headers,
        body: `no user "${givenUsername}" found`,
      };
      return response;
    } else {
      const response = {
        statusCode: 200,
        headers,
        body: JSON.stringify(databaseGetResponse.Item),
      };
      return response;
    }
  } catch (databaseGetItemError) {
    const response = {
      statusCode: 500,
      headers,
      body: "failed to get item",
    };
    return response;
  }
};

exports.handler = async function (event: any) {
  if (validateUserInput(event)) {
    const response = await fetchUser(
      process.env.USERS_TABLE_NAME as string,
      event.queryStringParameters.username
    );
    return response;
  } else {
    const response = {
      statusCode: 400,
      headers,
      body: getErrorMessage(event),
    };
    return response;
  }
};

exports.fetchUser = fetchUser;
