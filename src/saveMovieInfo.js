const AWS = require("aws-sdk");
const headers = require("./constants");
const { getFetchMovieParams } = require("./functions");

// const fetchMovie = async (tableName, movieId) => {
//   try {

//     return databaseGetResponse;
//   } catch (databaseGetItemError) {
//     return databaseGetItemError;
//   }
// };

exports.handler = async function (event) {
  console.log(event, "event");
  console.log(event.body, "event.body");
  const parsedBody = JSON.parse(event.body);
  console.log(parsedBody, "parsedBody");
  parsedBody.results.forEach(movie => {
    const fetchUserParams = getFetchMovieParams(process.env.MOVIE_TABLE_NAME, parsedBody.resultsid);
    const dynamodb = new AWS.DynamoDB();
    const databaseGetItem = dynamodb
      .getItem(fetchUserParams)
      .promise();
      databaseGetItem.then(item => {
        retur
      })
  });
  console.log(fetchMovieResponse, 'fetchMovieResponse');
  if (fetchMovieResponse)
  const modifiedItem = {
    username: { S: event.userName },
    userId: { S: event.request.userAttributes.sub },
    created: { N: `${Date.now()}` },
    // uploaded images to s3 bucket /random, need to recreate these on another initiliazition
    profilePicture: { S: `random/${pictureIndex}.jpg` },
  }; 
};
