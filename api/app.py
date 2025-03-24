from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import pandas as pd

import sqlalchemy
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_NAME = os.getenv('DB_NAME')

db = sqlalchemy.create_engine(f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}")

@app.route('/games')
def games():
    f = "{gameId}: {awayTeam} @ {homeTeam}, {gameTimeLTZ}" 

    board = scoreboard.ScoreBoard()
    print("ScoreBoardDate: " + board.score_board_date)
    games = board.games.get_dict()
    todaysGames = []

    for game in games:
        gameId = game['gameId']
        gameStatus = game['gameStatus']
        gameStatusText = game['gameStatusText']
        awayTeam = game['awayTeam']['teamName']
        awayId = game['awayTeam']['teamId']
        awayScore = game['awayTeam']['score']
        homeTeam = game['homeTeam']['teamName']
        homeId = game['homeTeam']['teamId']
        homeScore = game['homeTeam']['score']
        gameTimeUTC = game["gameTimeUTC"]
        #gameTimeLTZ = gameTimeUTC.replace(tzinfo=timezone.utc).astimezone(tz=None)

        todaysGames.append([gameId, gameStatus, gameStatusText, awayTeam, awayId, awayScore, homeTeam, homeId, homeScore, gameTimeUTC])

    return todaysGames

@app.route('/players')
def players():
    query = """SELECT 
            p.TEAM_ID, 
            p.TEAM_FULL_NAME, 
            p.PLAYER_ID, 
            p.PLAYER_FULL_NAME, 
            p.POSITION, 
            p.TEAM_NAME, 
            p.JERSEY_NUMBER,
            g.PTS, 
            g.REB, 
            g.AST, 
            g.STL, 
            g.BLK, 
            g.TOV, 
            g.Scoring, 
            g.Playmaking, 
            g.Rebounding, 
            g.Defense, 
            g.Athleticism,
            g.Archetype
        FROM players p
        LEFT JOIN grades g ON p.PLAYER_ID = g.PLAYER_ID
    """
    players_db = pd.read_sql(query, con=db)

    players_dict = {}
    for index, row in players_db.iterrows():
        team_id, team_name, player_id, player_name, position, team, jersey_number, points, rebounds, assists, steals, blocks, turnovers, scoring_grade, playmaking_grade, rebounding_grade, defense_grade, athleticism_grade, archetype = row
        
        # Helper function to replace NaN with None
        def sanitize_value(value):
            return None if isinstance(value, float) and isnan(value) else value

        if team_id not in players_dict:
            players_dict[team_id] = {'team_name': team_name, 'players': []}
        players_dict[team_id]['players'].append({
            'player_id': player_id, 
            'player_name': player_name, 
            'position': position, 
            'team': team, 
            'jersey_number': jersey_number, 
            'points': sanitize_value(points), 
            'rebounds': sanitize_value(rebounds), 
            'assists': sanitize_value(assists), 
            'steals': sanitize_value(steals), 
            'blocks': sanitize_value(blocks), 
            'turnovers': sanitize_value(turnovers), 
            'scoring_grade': sanitize_value(scoring_grade), 
            'playmaking_grade': sanitize_value(playmaking_grade), 
            'rebounding_grade': sanitize_value(rebounding_grade), 
            'defense_grade': sanitize_value(defense_grade), 
            'athleticism_grade': sanitize_value(athleticism_grade),
            'archetype': sanitize_value(archetype)
        })

    return jsonify(players_dict)

@app.route('/teams')
def teams():
    teams_db = pd.read_sql("SELECT TEAM_ID, TEAM_FULL_NAME, CITY, ARENA, OWNER, GENERALMANAGER, HEADCOACH FROM teams", con=db)
    standings_db = pd.read_sql("SELECT TeamID, Conference, Record, PlayoffRank FROM standings", con=db)

    standings_db = standings_db.rename(columns={'TeamID': 'TEAM_ID'})

    merged_db = teams_db.merge(standings_db, on='TEAM_ID', how='left')

    teams_dict = {}
    for index, row in merged_db.iterrows():
        team_id, team_name , city, arena, owner, generalmanager, headcoach, conference, record, playoffrank = row
        teams_dict[team_id] = {'team_name': team_name, 'city': city, 'arena': arena, 'owner': owner, 'general_manager': generalmanager, 'head_coach': headcoach, 'conference': conference, 'record': record, 'playoff_rank': playoffrank}
    return jsonify(teams_dict)
    
@app.route('/games/<gameId>')
def gamePlayers(gameId):
    game_info = next((game for game in games() if game[0] == gameId), None)
    if game_info is None:
        return "Game not found", 404

    gameId, gameStatus, gameStatusText, awayTeam, awayId, awayScore, homeTeam, homeId, homeScore, gameTimeUTC = game_info

    away_players = pd.read_sql(f"SELECT Player_ID, PLAYER_FULL_NAME, POSITION, TEAM_NAME, JERSEY_NUMBER FROM players WHERE Team_Id = {awayId}", con=db)
    home_players = pd.read_sql(f"SELECT Player_ID, PLAYER_FULL_NAME, POSITION, TEAM_NAME, JERSEY_NUMBER FROM players WHERE Team_Id = {homeId}", con=db)

    combined_players = {
        'away': [{'id': player_id, 'name': player_name, 'position': position, 'team_name': team_name, 'jersey_number': jersey_number} for player_id, player_name, position, team_name, jersey_number in zip(away_players['Player_ID'].tolist(), away_players['PLAYER_FULL_NAME'].tolist(), away_players['POSITION'].tolist(), away_players['TEAM_NAME'].tolist(), away_players['JERSEY_NUMBER'].tolist())],
        'home': [{'id': player_id, 'name': player_name, 'position': position, 'team_name': team_name, 'jersey_number': jersey_number} for player_id, player_name, position, team_name, jersey_number in zip(home_players['Player_ID'].tolist(), home_players['PLAYER_FULL_NAME'].tolist(), home_players['POSITION'].tolist(), home_players['TEAM_NAME'].tolist(), home_players['JERSEY_NUMBER'].tolist())]
    }

    return combined_players

@app.route('/nba/player/<playerId>')
def nbaPlayerInfo(playerId):
    player_info = (pd.read_sql(f"SELECT * FROM players WHERE Player_ID = {playerId}", con=db)).to_dict(orient='records')
    player_log = pd.read_sql(f"SELECT *, STR_TO_DATE(GAME_DATE, '%M %d, %Y') AS formatted_date FROM gamelogs WHERE Player_ID = {playerId} ORDER BY formatted_date ASC", con=db)
    player_grades = (pd.read_sql(f"SELECT PTS, REB, AST, STL, BLK, TOV, Scoring, Playmaking, Rebounding, Defense, Athleticism FROM grades WHERE Player_ID = {playerId}", con=db)).to_dict(orient='records')


    gamelogs = []
    for index, row in player_log.iterrows():
        gamelog = {
            'game_id': row['Game_ID'],
            'game_date': row['GAME_DATE'],
            'matchup': row['MATCHUP'],
            'opp': row['Opponent'],
            'outcome': row['WL'],
            'mins_played': row['MIN'],
            'fg_made': row['FG Made'],
            'fg_att': row['FG Attempted'],
            'fg_pct': row['FG_PCT'],
            'fg3_made': row['3-PT Made'],
            'fg3_att': row['3-PT Attempted'],
            'fg3_pct': row['FG3_PCT'],
            'ft_made': row['Free Throws Made'],
            'ft_att': row['Free Throws Attempted'],
            'ft_pct': row['FT_PCT'],
            'oreb': row['Offensive Rebounds'],
            'dreb': row['Defensive Rebounds'],
            'reb': row['Rebounds'],
            'ast': row['Assists'],
            'stl': row['Steals'],
            'blk': row['Blocked Shots'],
            'tov': row['Turnovers'],
            'foul': row['PF'],
            'pts': row['Points'],
            'plus_minus': row['PLUS_MINUS'],
            'pra': row['Pts+Rebs+Asts'],
            'pr': row['Pts+Rebs'],
            'pa': row['Pts+Asts'],
            'ra': row['Rebs+Asts'],
            'stocks': row['Blks+Stls'],
            'fantasy': row['Fantasy Score']
        }
        gamelogs.append(gamelog)

    player_profile = {
        'player_info': player_info,
        'gamelogs': gamelogs,
        'player_grades': player_grades
    }

    return jsonify(player_profile)

if __name__ == '__main__':
    app.run(debug=False)
