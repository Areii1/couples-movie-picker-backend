const AWS = require("aws-sdk");
const headers = require("./constants");
const { validateUserInput, getErrorMessage } = require("./utilityFunctions");

const addLikedMovie = async (movieId, score) => {
  const params = {
    TableName: process.env.USERS_TABLE_NAME,
    Key: {
      username: {
        S: "ari",
      },
    },
    UpdateExpression: "SET *m = :m",
    ExpressionAttributeNames: {
      "*m": "movies",
    },
    ExpressionAttributeValues: {
      ":m": { L: [{ id: { S: movieId }, score: { N: score } }] },
    },
  };
  try {
    const dynamodb = new AWS.DynamoDB();
    const databaseGetResponse = await dynamodb.updateItem(params).promise();
    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify(databaseGetResponse.Item),
    };
    return response;
  } catch (databaseGetItemError) {
    const response = {
      statusCode: 500,
      headers,
      body: "failed to get item",
    };
    return response;
  }
};

const requiredAttributes = [
  { name: "movieId", type: "string" },
  { name: "score", type: "number" },
];

exports.handler = async function (event) {
  if (validateUserInput(event, requiredAttributes, [])) {
    const parsedBody = JSON.parse(event.body);
    const addLikedMovieResponse = addLikedMovie(
      parsedBody.movieId,
      parsedBody.score
    );
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(addLikedMovieResponse),
    };
  } else {
    return {
      statusCode: 400,
      headers,
      body: getErrorMessage(event),
    };
  }
};
