const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server Running at http://localhost:3003/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//GET players API
app.get("/players/", async (request, response) => {
  const getPlayers = `
        SELECT player_id as playerId,
        player_name as playerName
        FROM player_details
    `;
  const getPlayerDetails = await db.all(getPlayers);
  response.send(getPlayerDetails);
});

//GET specificPlayers API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayers = `
            SELECT player_id as playerId,
            player_name as playerName
            FROM player_details
            WHERE player_id=${playerId}
    `;
  const getSpecificPlayerDetails = await db.get(getSpecificPlayers);
  response.send(getSpecificPlayerDetails);
});

//PUT players API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `
  UPDATE player_details
  SET player_name='${playerName}'
  WHERE player_id=${playerId}
  `;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//GET matches API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatches = `
        SELECT match_id as matchId,
        match,year
        FROM match_details
        WHERE match_id=${matchId}
  `;
  const getMatchDetails = await db.get(getMatches);
  response.send(getMatchDetails);
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
        SELECT match_id as matchId,
        match,year
        FROM player_match_score NATURAL JOIN match_details
        WHERE player_id=${playerId}
    `;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  response.send(playerMatches);
});

//GET listOfPlayers API
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getListOfPlayers = `
    SELECT player_id as playerId,
    player_name as playerName
    FROM player_match_score NATURAL JOIN player_details
    WHERE match_id=${matchId}
  `;
  const listOfPlayers = await db.all(getListOfPlayers);
  response.send(listOfPlayers);
});

// GET totalScores
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const totalScores = `
           SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};

  `;
  const total = await db.get(totalScores);
  response.send(total);
});
module.exports = app;
