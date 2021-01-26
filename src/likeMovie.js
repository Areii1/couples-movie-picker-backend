const AWS = require("aws-sdk");
const headers = require("./constants");
const { getFetchUserParams } = require("./functions");

const fetchUser = async (tableName, givenUsername) => {
  try {
    const fetchUserParams = getFetchUserParams(tableName, givenUsername);
    const dynamodb = new AWS.DynamoDB();
    const databaseGetResponse = await dynamodb
      .getItem(fetchUserParams)
      .promise();
    return databaseGetResponse;
  } catch (databaseGetItemError) {
    return databaseGetItemError;
  }
};

const addLikedMovie = async (movieId, score, person) => {
  try {
    const fetchUserResponse = await fetchUser(
      process.env.USERS_TABLE_NAME,
      person
    );
    let params;
    if (!fetchUserResponse.Item.likedMovies) {
      console.log(
        !fetchUserResponse.Item.likedMovies,
        "!fetchUserResponse.Item.likedMovies"
      );

      params = {
        TableName: process.env.USERS_TABLE_NAME,
        Key: {
          username: {
            S: person,
          },
        },
        UpdateExpression: "SET #lm = :lm",
        ExpressionAttributeNames: {
          "#lm": "likedMovies",
        },
        ExpressionAttributeValues: {
          ":lm": { L: [{ M: { id: { S: movieId }, score: { N: score } } }] },
        },
        ReturnValues: "UPDATED_NEW",
      };
    } else {
      const movieExists =
        fetchUserResponse.Item.likedMovies.L.find(
          (item) => item.M.id.S === movieId
        ) !== undefined;
      console.log(movieExists, "movieExists");
      if (!movieExists) {
        const modifiedList = [
          ...fetchUserResponse.Item.likedMovies.L,
          { M: { id: { S: movieId }, score: { N: score } } },
        ];
        console.log(modifiedList, "modifiedList");
        params = {
          TableName: process.env.USERS_TABLE_NAME,
          Key: {
            username: {
              S: person,
            },
          },
          UpdateExpression: "SET #lm = :lm",
          ExpressionAttributeNames: {
            "#lm": "likedMovies",
          },
          ExpressionAttributeValues: {
            ":lm": { L: modifiedList },
          },
          ReturnValues: "UPDATED_NEW",
        };
      } else {
        const response = {
          statusCode: 400,
          headers,
          body: "movie already liked",
        };
        return response;
      }
    }
    console.log(params, "params");
    const dynamodb = new AWS.DynamoDB();
    const databaseUpdateResponse = await dynamodb.updateItem(params).promise();
    console.log(databaseUpdateResponse, "databaseUpdateResponse");
    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify(databaseUpdateResponse),
    };
    return response;
  } catch (databaseGetItemError) {
    console.log(databaseGetItemError, "databaseGetItemError");
    const response = {
      statusCode: 500,
      headers,
      body: "failed to get item",
    };
    return response;
  }
};

exports.handler = async function (event) {
  const addLikedMovieResponse = await addLikedMovie(
    event.queryStringParameters.id,
    event.queryStringParameters.value,
    event.requestContext.authorizer.claims["cognito:username"]
  );
  console.log(addLikedMovieResponse, "addLikedMovieResponse");
  return addLikedMovieResponse;
};
