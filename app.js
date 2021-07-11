const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error Message : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertMovieToResponse = (obj) => {
  return {
    movieId: obj.movie_id,
    directorId: obj.director_id,
    movieName: obj.movie_name,
    leadActor: obj.lead_actor,
  };
};

const convertDirectorToResponse = (obj) => {
  return {
    directorId: obj.director_id,
    directorName: obj.director_name,
  };
};

//GET movies list
app.get("/movies/", async (request, response) => {
  const moviesQuery = `
    SELECT movie_name FROM movie ORDER BY movie_id;`;
  const dbResponse = await db.all(moviesQuery);
  response.send(dbResponse.map((each) => ({ movieName: each.movie_name })));
});

//Add new movie
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;

  const { directorId, movieName, leadActor } = movieDetails;

  const addMovieQuery = `
    INSERT INTO movie(
        director_id,
        movie_name,
        lead_actor) VALUES(${directorId},
            '${movieName}',
            '${leadActor}');`;

  const dbResponse = await db.run(addMovieQuery);
  const movieId = dbResponse.lastID;

  response.send("Movie Successfully Added");
});

//GET movies using movie ID
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT * FROM movie 
    WHERE movie_id=${movieId};`;

  const dbResponse = await db.all(getMovieQuery);
  response.send(dbResponse.map((each) => convertMovieToResponse(each)));
});

//Update movies using movie ID
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;

  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
    UPDATE movie SET
    director_id=${directorId},
    movie_name='${movieName}',
    lead_actor='${leadActor}'
    WHERE movie_id=${movieId};`;

  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//Delete Movie using movie ID
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM movie 
    WHERE movie_id=${movieId};`;

  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//GET list of directors
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT * FROM director;`;

  const dbResponse = await db.all(getDirectorsQuery);

  response.send(dbResponse.map((each) => convertDirectorToResponse(each)));
});

//GET list of movies using directorId
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;

  const getDirectorMoviesQuery = `
    SELECT movie_name FROM movie 
    WHERE director_id=${directorId};`;

  const dbResponse = await db.all(getDirectorMoviesQuery);
  response.send(
    dbResponse.map((each) => {
      return {
        movieName: each.movie_name,
      };
    })
  );
});

module.exports = app;
