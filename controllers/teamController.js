const Player = require('../models/Player');
const Team = require('../models/Team');
const matchData = require('../data/match.json');


const validateTeamComposition = (players) => {
 
  if (players.length !== 11) {
    throw new Error('Team must have exactly 11 players');
  }

  const uniquePlayers = new Set(players);
  if (uniquePlayers.size !== players.length) {
    throw new Error('Duplicate players are not allowed');
  }
  
};

const validateRoleCounts = (playerCounts) => {
  
  const roleRequirements = {
    WICKETKEEPER: { min: 1, max: 8 },
    BATTER: { min: 1, max: 8 },
    ALLROUNDER: { min: 1, max: 8 },
    BOWLER: { min: 1, max: 8 }
  };

  for (const role in roleRequirements) {
    const count = playerCounts[role];
    if (count < roleRequirements[role].min || count > roleRequirements[role].max) {
      throw new Error(`Invalid number of players for role ${role}`);
    }
  }
 
};

const validateTeamCounts = (teamCounts) => {
  
  const maxPlayersPerTeam = 10;
  for (const team in teamCounts) {
    if (teamCounts[team] > maxPlayersPerTeam) {
      throw new Error(`A maximum of ${maxPlayersPerTeam} players can be selected from ${team}`);
    }
  }
  console.log('Team counts validation successful');
};

const validateCaptainAndViceCaptain = (players, captain, viceCaptain) => {
  console.log('Validating captain and vice-captain...');
  if (!players.includes(captain) || !players.includes(viceCaptain)) {
    throw new Error('Captain and Vice-Captain must be selected from team players');
  }
 
};

exports.addTeam = async (req, res) => {
  const { teamName, players, captain, viceCaptain } = req.body;

  try {
  
    validateTeamComposition(players);

    const playerRoles = await Player.find({ name: { $in: players } });
console.log(playerRoles[0].role)
    const playerCounts = {
      WICKETKEEPER: 0,
      BATTER: 0,
      ALLROUNDER: 0,
      BOWLER: 0
    };
    const teamCounts = {};

    for (const player of playerRoles) {
      const role = player.role;
      const team = player.team;

      if (role) {
        playerCounts[role]++;
      } else {
        console.error(`Role not found in database for player: ${player.player}`);
      }

      teamCounts[team] = (teamCounts[team] || 0) + 1;
    }

    validateRoleCounts(playerCounts);
    validateTeamCounts(teamCounts);
    validateCaptainAndViceCaptain(players, captain, viceCaptain);

    const team = new Team({ teamName, players, captain, viceCaptain });
    await team.save();
    console.log('Team entry added successfully');
    res.status(201).send('Team entry added successfully');
  } catch (error) {
    console.error('Error adding team entry:', error.message);
    res.status(400).send(error.message);
  }
};
exports.processResult = async (req, res) => {
  const teams = await Team.find();
 
  const players = await Player.find();

 
  players.forEach(player => {
    player.points = 0;
  });

  
  teams.forEach(team => {
    team.totalPoints = 0;
  });
  matchData.forEach(ball => {
    const batter = players.find(p => p.name === ball.batter);
    const bowler = players.find(p => p.name === ball.bowler);

    
    if (batter) {
      batter.points += ball.batsman_run;
      if (ball.batsman_run === 4) batter.points += 1; 
      if (ball.batsman_run === 6) batter.points += 2; 
      if (batter.name === batter.captain) batter.points += ball.batsman_run; 
      if (batter.name === batter.viceCaptain) batter.points += ball.batsman_run * 1.5;
    }

    
    if (bowler && ball.isWicketDelivery) {
      bowler.points += 25;  
      if (['bowled', 'lbw'].includes(ball.kind)) {
        bowler.points += 8;  
      }
      if (bowler.name === bowler.captain) bowler.points += 25; 
      if (bowler.name === bowler.viceCaptain) bowler.points += 25 * 1.5; 
    }

    
    if (ball.fielders_involved && ball.fielders_involved !== 'NA') {
      const fielderName = ball.fielders_involved.trim();
      const fielder = players.find(p => p.name === fielderName);
      if (fielder) {
        if (ball.kind === 'catch') {
          fielder.points += 8;  
        } else if (ball.kind === 'stumping') {
          fielder.points += 12;  
        } else if (ball.kind === 'runout') {
          fielder.points += 6;  
        }
        if (fielder.name === fielder.captain) {
          fielder.points *= 2;  
        }
        if (fielder.name === fielder.viceCaptain) {
          fielder.points *= 1.5;  
        }
      }
    }
  });

  await Promise.all(players.map(player => player.save()));

  for (const team of teams) {
    team.totalPoints = team.players.reduce((acc, playerName) => {
      const player = players.find(p => p.name === playerName);
    
      return acc + (player ? player.points : 0);
    }, 0);

    await team.save();
  }

  res.status(200).send('Match result processed successfully');
};

exports.teamResult = async (req, res) => {
  const teams = await Team.find().sort({ totalPoints: -1 });
  const topScore = teams[0].totalPoints;
  const winners = teams.filter(team => team.totalPoints === topScore);
  console.log('The Winner of the Match is', teams[0].teamName );
  res.status(200).json(winners);
};
