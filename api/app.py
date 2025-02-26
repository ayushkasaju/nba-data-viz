from flask import Flask, render_template, request, jsonify
import pandas as pd
import time
from apscheduler.schedulers.background import BackgroundScheduler

from nba_api.stats.endpoints import playergamelog
from nba_api.stats.endpoints import playerindex
from nba_api.stats.endpoints import teamdetails
from nba_api.stats.endpoints import leaguestandingsv3
from nba_api.live.nba.endpoints import scoreboard
from nba_api.stats.endpoints import leaguedashplayerstats

import requests
from requests.exceptions import Timeout
import random

import sqlalchemy


app = Flask(__name__)

def fetchPlayers():
    db = sqlalchemy.create_engine("mysql+mysqlconnector://root:password@localhost/nba2024")
    table = "players"

    # Fetch player data from the NBA API
    active_players = playerindex.PlayerIndex()
    players_df = active_players.get_data_frames()[0]

    # Create a full name column
    players_df["PLAYER_FULL_NAME"] = players_df["PLAYER_FIRST_NAME"] + " " + players_df["PLAYER_LAST_NAME"]

    # Drop unnecessary columns
    columns_to_remove = [col for col in players_df.columns if any(substring in col for substring in ('PLAYER_SLUG', 'TEAM_SLUG', 'IS_DEFUNCT', 'STATS_TIMEFRAME'))]
    players_df = players_df.drop(columns=columns_to_remove)

    # Create a full team name column
    players_df["TEAM_FULL_NAME"] = players_df["TEAM_CITY"] + " " + players_df["TEAM_NAME"]

    # Select relevant columns for the frontend
    players_df = players_df[[
        'TEAM_ID', 'TEAM_FULL_NAME', 'PERSON_ID', 'PLAYER_FIRST_NAME', 'PLAYER_LAST_NAME', 'PLAYER_FULL_NAME',
        'POSITION', 'TEAM_NAME', 'JERSEY_NUMBER', 'HEIGHT', 'WEIGHT', 'COLLEGE',
        'DRAFT_YEAR', 'DRAFT_ROUND', 'DRAFT_NUMBER'
    ]]

    # Rename columns to match database schema
    players_df = players_df.rename(columns={'PERSON_ID': 'PLAYER_ID'})

    # Convert data types
    data_dict = {
        'TEAM_ID': int,
        'TEAM_FULL_NAME': str,
        'PLAYER_ID': int,
        'PLAYER_FIRST_NAME': str,
        'PLAYER_LAST_NAME': str,
        'PLAYER_FULL_NAME': str,
        'POSITION': str,
        'TEAM_NAME': str,
        'JERSEY_NUMBER': str,
        'HEIGHT': str,
        'WEIGHT': str,
        'COLLEGE': str,
        'DRAFT_YEAR': str,
        'DRAFT_ROUND': str,
        'DRAFT_NUMBER': str
    }
    players_df = players_df.astype(data_dict)

    # Replace NaN with 0 before converting columns to integers
    players_df['DRAFT_YEAR'] = pd.to_numeric(players_df['DRAFT_YEAR'], errors='coerce').fillna(0).astype(int)
    players_df['DRAFT_ROUND'] = pd.to_numeric(players_df['DRAFT_ROUND'], errors='coerce').fillna(0).astype(int)
    players_df['DRAFT_NUMBER'] = pd.to_numeric(players_df['DRAFT_NUMBER'], errors='coerce').fillna(0).astype(int)

    # Insert or update players in the database
    players_df.to_sql(name=table, con=db, if_exists='replace', index=False)
    print("Players table updated successfully with all required fields!")

def fetchTeams():
    db = sqlalchemy.create_engine("mysql+mysqlconnector://root:password@localhost/nba2024")
    table = "teams"

    team_db = pd.read_sql("SELECT DISTINCT TEAM_ID, TEAM_FULL_NAME FROM PLAYERS", con=db)

    team_data = []
    for index, row in team_db.iterrows():
        team_id = row["TEAM_ID"]
        name = row["TEAM_FULL_NAME"]
        teams = teamdetails.TeamDetails(team_id=team_id)
        teams_df = teams.get_data_frames()[0]
        team_data.append(teams_df)
        print(f"{name} added to team_data")
        time.sleep(10)

    if team_data:
        final_df = pd.concat(team_data, ignore_index=True)
        final_df.to_sql(name=table, con=db, if_exists='replace', index=False)

    print("teams added to database")

def fetchGamelogs():
    db = sqlalchemy.create_engine("mysql+mysqlconnector://root:password@localhost/nba2024")
    table = "gamelogs"
    
    active = playerindex.PlayerIndex()
    active_df = active.get_data_frames()[0]

    active_df["PLAYER_FULL_NAME"] = active_df["PLAYER_FIRST_NAME"] + " " + active_df["PLAYER_LAST_NAME"]
    column_to_move = active_df.pop("PLAYER_FULL_NAME")
    active_df.insert(1, "PLAYER_FULL_NAME", column_to_move)

    columns_to_remove = [col for col in active_df.columns if any(substring in col for substring in ('PLAYER_SLUG', 'TEAM_SLUG', 'IS_DEFUNCT', 'STATS_TIMEFRAME'))]
    active_df = active_df.drop(columns=columns_to_remove)

    active_df["TEAM_FULL_NAME"] = active_df["TEAM_CITY"] + " " + active_df["TEAM_NAME"]
    column_to_move = active_df.pop("TEAM_FULL_NAME")
    active_df.insert(5, "TEAM_FULL_NAME", column_to_move)

    playerId = None
    playerName = None
    seasons = ['2024-25']#, '2023-24', '2022-23', '2021-22', '2020-21', '2019-20'] #, '2018-19', '2017-18', '2016-17', '2015-16', '2014-15', '2013-14', '2012-13', '2011-12', '2010-11', '2009-10', '2008-09', '2007-08', '2006-07', '2005-06', '2004-05', '2003-04']
    gamelog_df = []
    gamelog_df = pd.DataFrame(gamelog_df)

    for index, row in active_df.iterrows():
        playerId = row['PERSON_ID']
        playerName = row['PLAYER_FULL_NAME']

        for season in seasons:
            retry_count = 0
            while retry_count < 8:
                try:
                    gamelog = playergamelog.PlayerGameLog(player_id=playerId, season=season, timeout=60)
                    new = gamelog.get_data_frames()[0]
                    new['Player_Name'] = playerName

                    existing = pd.read_sql(f"SELECT * FROM {table} WHERE Player_ID = {playerId}", con=db)
                    new = new[~new['GAME_DATE'].isin(existing['GAME_DATE'])]

                    if not new.empty:
                        gamelog_df = pd.concat([gamelog_df, new], ignore_index=True)
                        print(f"{playerName} {season} gamelog added")
                    else:
                        print(f"{playerName} {season} gamelog already up to date")

                    # if not gamelog_df.empty:
                    #     new_games = gamelog.get_data_frames()[0]
                    #     new_games['Player_Name'] = playerName
                    #     # existing_games = set(gamelog_df['Game_ID'])
                    #     # new_games = new_games[~new_games['Game_ID'].isin(existing_games)]

                    #     gamelog_df = pd.concat([gamelog_df, new_games], ignore_index=True)
                    #     print(f"{playerName} {season} gamelog added")
                    # else:
                    #     gamelog_df = gamelog.get_data_frames()[0]
                    #     gamelog_df['Player_Name'] = playerName
                    #     print(f"{playerName} {season} gamelog added")
                    break

                except (requests.exceptions.RequestException, Timeout) as e:
                    wait_time = (2 ** retry_count) + random.uniform(0, 1)  # Exponential backoff
                    print(f"Retry {retry_count + 1} for {playerName} {season} after {wait_time:.2f}s: {e}")
                    time.sleep(wait_time)
                    retry_count += 1
            else:
                print(f"Max retries reached for {playerName} in season {season}.")
            time.sleep(10)
            
    columns_to_remove = [col for col in gamelog_df.columns if any(substring in col for substring in ('SEASON_ID', 'VIDEO_AVAILABLE'))]
    gamelog_df = gamelog_df.drop(columns=columns_to_remove)
    gamelog_df.insert(2, 'Player_Name', gamelog_df.pop('Player_Name'))
    gamelog_df['Opponent'] = gamelog_df['MATCHUP'].str.extract(r'vs\. (.+)', expand=False).combine_first(gamelog_df['MATCHUP'].str.extract(r'@ (.+)', expand=False))
    gamelog_df['Opponent'] = gamelog_df['Opponent'].str.strip()
    columns = gamelog_df.columns.tolist()
    columns = columns[:5] + ['Opponent'] + columns[5:]
    gamelog_df['Pts+Rebs+Asts'] = gamelog_df['PTS'] + gamelog_df['REB'] + gamelog_df['AST']
    gamelog_df['Pts+Rebs'] = gamelog_df['PTS'] + gamelog_df['REB']
    gamelog_df['Pts+Asts'] = gamelog_df['PTS'] + gamelog_df['AST']
    gamelog_df['Rebs+Asts'] = gamelog_df['REB'] + gamelog_df['AST']
    gamelog_df['Blks+Stls'] = gamelog_df['BLK'] + gamelog_df['STL']
    gamelog_df['Fantasy Score'] = gamelog_df['PTS'] + (gamelog_df['REB'] * 1.2) + (gamelog_df['AST'] * 1.5) + (gamelog_df['STL'] * 3) + (gamelog_df['BLK'] * 3) - gamelog_df['TOV']

    gamelog_df = gamelog_df.rename(columns={'PTS' : 'Points', 'REB' : 'Rebounds', 'AST' : 'Assists', 'STL' : 'Steals', 'BLK' : 'Blocked Shots', 'TOV' : 'Turnovers', 'DREB' : 'Defensive Rebounds', 'OREB' : 'Offensive Rebounds', 'FGA' : 'FG Attempted', 'FGM' : 'FG Made', 'FG3M' : '3-PT Made', 'FG3A' : '3-PT Attempted', 'FTM' : 'Free Throws Made', 'FTA' : 'Free Throws Attempted'})
    gamelog_df = gamelog_df.fillna(0)

    data_dict = {
        'Game_ID': int,
        'Player_ID': int,
        'Player_Name': str,
        'GAME_DATE': str,
        'MATCHUP': str,
        'WL': str,
        'MIN': float,
        'FG Made': int,
        'FG Attempted': int,
        'FG_PCT': float,
        '3-PT Made': int,
        '3-PT Attempted': int,
        'FG3_PCT': float,
        'Free Throws Made': int,
        'Free Throws Attempted': int,
        'FT_PCT': float,
        'Offensive Rebounds': int,
        'Defensive Rebounds': int,
        'Rebounds': int,
        'Assists': int,
        'Steals': int,
        'Blocked Shots': int,
        'Turnovers': int,
        'PF': int,
        'Points': int,
        'PLUS_MINUS': int,
        'Opponent': str,
        'Pts+Rebs+Asts': int,
        'Pts+Rebs': int,
        'Pts+Asts': int,
        'Rebs+Asts': int,
        'Blks+Stls': int,
        'Fantasy Score': float
    }

    gamelog_df = gamelog_df.astype(data_dict)

    gamelog_df.to_sql(name=table, con=db, if_exists='append', index=False)

def fetchStandings():
    db = sqlalchemy.create_engine("mysql+mysqlconnector://root:password@localhost/nba2024")
    table = "standings"

    standings_data = []
    standings = leaguestandingsv3.LeagueStandingsV3()
    standings_df = standings.get_data_frames()[0]

    standings_data.append(standings_df)
    final_df = pd.concat(standings_data, ignore_index=True)
    final_df.to_sql(name=table, con=db, if_exists='replace', index=False)
    print("standings updated")

scheduler = BackgroundScheduler()

@scheduler.scheduled_job('cron', hour=2, timezone='US/Central')
def runPrograms():
    fetchPlayers()
    fetchStandings()
    fetchGamelogs()

scheduler.start()

@app.route('/games')
def games():
    f = "{gameId}: {awayTeam} @ {homeTeam}, {gameTimeLTZ}" 

    board = scoreboard.ScoreBoard()
    print("ScoreBoardDate: " + board.score_board_date)
    games = board.games.get_dict()
    todaysGames = []

    for game in games:
        gameId = game['gameId']
        awayTeam = game['awayTeam']['teamName']
        awayId = game['awayTeam']['teamId']
        homeTeam = game['homeTeam']['teamName']
        homeId = game['homeTeam']['teamId']
        #gameTimeUTC = parser.parse(game["gameTimeUTC"])
        #gameTimeLTZ = gameTimeUTC.replace(tzinfo=timezone.utc).astimezone(tz=None)

        todaysGames.append([gameId, awayTeam, awayId, homeTeam, homeId])

    return todaysGames

@app.route('/players')
def players():
    db = sqlalchemy.create_engine("mysql+mysqlconnector://root:password@localhost/nba2024")

    players_db = pd.read_sql("SELECT TEAM_ID, TEAM_FULL_NAME, PLAYER_ID, PLAYER_FULL_NAME, POSITION, TEAM_NAME, JERSEY_NUMBER FROM players", con=db)

    players_dict = {}
    for index, row in players_db.iterrows():
        team_id, team_name, player_id, player_name, position, team, jersey_number  = row
        if team_id not in players_dict:
            players_dict[team_id] = {'team_name': team_name, 'players': []}
        players_dict[team_id]['players'].append({'player_id': player_id, 'player_name': player_name, 'position': position, 'team': team, 'jersey_number': jersey_number})

    return jsonify(players_dict)

@app.route('/teams')
def teams():
    db = sqlalchemy.create_engine("mysql+mysqlconnector://root:password@localhost/nba2024")

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
    db = sqlalchemy.create_engine("mysql+mysqlconnector://root:password@localhost/nba2024")

    game_info = next((game for game in games() if game[0] == gameId), None)
    if game_info is None:
        return "Game not found", 404

    gameId, awayTeam, awayId, homeTeam, homeId = game_info

    away_players = pd.read_sql(f"SELECT Player_ID, PLAYER_FULL_NAME, POSITION, TEAM_NAME, JERSEY_NUMBER FROM players WHERE Team_Id = {awayId}", con=db)
    home_players = pd.read_sql(f"SELECT Player_ID, PLAYER_FULL_NAME, POSITION, TEAM_NAME, JERSEY_NUMBER FROM players WHERE Team_Id = {homeId}", con=db)

    combined_players = {
        'away': [{'id': player_id, 'name': player_name, 'position': position, 'team_name': team_name, 'jersey_number': jersey_number} for player_id, player_name, position, team_name, jersey_number in zip(away_players['Player_ID'].tolist(), away_players['PLAYER_FULL_NAME'].tolist(), away_players['POSITION'].tolist(), away_players['TEAM_NAME'].tolist(), away_players['JERSEY_NUMBER'].tolist())],
        'home': [{'id': player_id, 'name': player_name, 'position': position, 'team_name': team_name, 'jersey_number': jersey_number} for player_id, player_name, position, team_name, jersey_number in zip(home_players['Player_ID'].tolist(), home_players['PLAYER_FULL_NAME'].tolist(), home_players['POSITION'].tolist(), home_players['TEAM_NAME'].tolist(), home_players['JERSEY_NUMBER'].tolist())]
    }

    return combined_players

@app.route('/nba/player/<playerId>')
def nbaPlayerInfo(playerId):
    db = sqlalchemy.create_engine("mysql+mysqlconnector://root:password@localhost/nba2024")

    player_info = (pd.read_sql(f"SELECT * FROM players WHERE Player_ID = {playerId}", con=db)).to_dict(orient='records')
    player_log = pd.read_sql(f"SELECT *, STR_TO_DATE(GAME_DATE, '%M %d, %Y') AS formatted_date FROM gamelogs WHERE Player_ID = {playerId} ORDER BY formatted_date ASC", con=db)


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
    }

    return jsonify(player_profile)

if __name__ == '__main__':
    app.run(debug=True)
