from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import pandas as pd
import time
from apscheduler.schedulers.background import BackgroundScheduler

from nba_api.stats.endpoints import playergamelog
from nba_api.stats.endpoints import playerindex
from nba_api.stats.endpoints import teamdetails
from nba_api.stats.endpoints import leaguestandingsv3
from nba_api.live.nba.endpoints import scoreboard
from nba_api.stats.endpoints import leaguedashplayerstats
from nba_api.stats.endpoints import leaguedashptstats
from nba_api.stats.endpoints import leaguehustlestatsplayer
from nba_api.stats.endpoints import leagueplayerondetails
from nba_api.stats.endpoints import playerdashboardbyshootingsplits

from sklearn.preprocessing import MinMaxScaler

import requests
from requests.exceptions import Timeout
import random

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

def fetchPlayers():
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
    table = "standings"

    standings_data = []
    standings = leaguestandingsv3.LeagueStandingsV3()
    standings_df = standings.get_data_frames()[0]

    standings_data.append(standings_df)
    final_df = pd.concat(standings_data, ignore_index=True)
    final_df.to_sql(name=table, con=db, if_exists='replace', index=False)
    print("standings updated")

def fetchGrades():
    table = "grades"


    player_base = leaguedashplayerstats.LeagueDashPlayerStats(measure_type_detailed_defense='Base', per_mode_detailed='PerGame')
    player_base_df = player_base.get_data_frames()[0]
    player_base_df = player_base_df.drop(columns=['AGE', 'W', 'L', 'W_PCT', 'FGM', 'FG_PCT', 'FG3A', 'FG3M', 'FG3_PCT', 'FTM', 'FT_PCT', 'BLKA', 'PFD', "PLUS_MINUS", "NBA_FANTASY_PTS", "DD2", "TD3", "WNBA_FANTASY_PTS", "GP_RANK", "W_RANK", "L_RANK", "W_PCT_RANK", "MIN_RANK", "FGM_RANK", "FGA_RANK", "FG_PCT_RANK", "FG3M_RANK", "FG3A_RANK", "FG3_PCT_RANK", "FTM_RANK", "FTA_RANK", "FT_PCT_RANK", "OREB_RANK", "DREB_RANK", "REB_RANK", "AST_RANK", "TOV_RANK", "STL_RANK", "BLK_RANK", "BLKA_RANK", "PF_RANK", "PFD_RANK", "PTS_RANK", "PLUS_MINUS_RANK", "NBA_FANTASY_PTS_RANK", "DD2_RANK", "TD3_RANK", "WNBA_FANTASY_PTS_RANK"],axis=1)

    player_adv = leaguedashplayerstats.LeagueDashPlayerStats(measure_type_detailed_defense='Advanced', per_mode_detailed='PerGame')
    player_adv_df = player_adv.get_data_frames()[0]
    player_adv_df = player_adv_df.drop(columns=[
        "AGE", "W", "L", "W_PCT", "E_OFF_RATING", "OFF_RATING", "sp_work_OFF_RATING",
        "E_DEF_RATING", "DEF_RATING", "sp_work_DEF_RATING", "E_NET_RATING", "NET_RATING", "sp_work_NET_RATING",
        "AST_PCT", "AST_TO", "AST_RATIO", "OREB_PCT", "DREB_PCT", "REB_PCT", "TM_TOV_PCT", "E_TOV_PCT",
        "E_USG_PCT", "E_PACE", "PACE", "PACE_PER40", "sp_work_PACE", "PIE", "POSS", "FGM", "FGA",
        "FGM_PG", "FGA_PG", "FG_PCT", "GP_RANK", "W_RANK", "L_RANK", "W_PCT_RANK", "MIN_RANK",
        "E_OFF_RATING_RANK", "OFF_RATING_RANK", "sp_work_OFF_RATING_RANK", "E_DEF_RATING_RANK",
        "DEF_RATING_RANK", "sp_work_DEF_RATING_RANK", "E_NET_RATING_RANK", "NET_RATING_RANK",
        "sp_work_NET_RATING_RANK", "AST_PCT_RANK", "AST_TO_RANK", "AST_RATIO_RANK",
        "OREB_PCT_RANK", "DREB_PCT_RANK", "REB_PCT_RANK", "TM_TOV_PCT_RANK", "E_TOV_PCT_RANK",
        "EFG_PCT_RANK", "TS_PCT_RANK", "USG_PCT_RANK", "E_USG_PCT_RANK", "E_PACE_RANK",
        "PACE_RANK", "sp_work_PACE_RANK", "PIE_RANK", "FGM_RANK", "FGA_RANK",
        "FGM_PG_RANK", "FGA_PG_RANK", "FG_PCT_RANK",'PLAYER_NAME', 
        'NICKNAME', 
        'TEAM_ID', 
        'TEAM_ABBREVIATION', 
        'GP', 
        'MIN'])
    
    player_misc = leaguedashplayerstats.LeagueDashPlayerStats(measure_type_detailed_defense='Misc', per_mode_detailed='PerGame')
    player_misc_df = player_misc.get_data_frames()[0]
    player_misc_df = player_misc_df.drop(columns=["AGE", "W", "L", "W_PCT", "PTS_OFF_TOV", "PTS_2ND_CHANCE", "PTS_PAINT",
        "OPP_PTS_OFF_TOV", "OPP_PTS_2ND_CHANCE", "OPP_PTS_FB", "OPP_PTS_PAINT",
        "BLK", "BLKA", "PF", "PFD", "NBA_FANTASY_PTS",
        "GP_RANK", "W_RANK", "L_RANK", "W_PCT_RANK", "MIN_RANK",
        "PTS_OFF_TOV_RANK", "PTS_2ND_CHANCE_RANK", "PTS_FB_RANK", "PTS_PAINT_RANK",
        "OPP_PTS_OFF_TOV_RANK", "OPP_PTS_2ND_CHANCE_RANK", "OPP_PTS_FB_RANK", "OPP_PTS_PAINT_RANK",
        "BLK_RANK", "BLKA_RANK", "PF_RANK", "PFD_RANK", "NBA_FANTASY_PTS_RANK",'PLAYER_NAME', 
        'NICKNAME', 
        'TEAM_ID', 
        'TEAM_ABBREVIATION', 
        'GP', 
        'MIN'])

    team_ids = player_base_df['TEAM_ID'].unique()
    player_opp_df = []
    for id in team_ids:
        player_opp = leagueplayerondetails.LeaguePlayerOnDetails(team_id=id, measure_type_detailed_defense='Opponent', per_mode_detailed='PerGame')
        p_opp_df = player_opp.get_data_frames()[0]
        player_opp_df.append(p_opp_df)
        time.sleep(1)
    player_opp_df = pd.concat(player_opp_df, ignore_index=True)
    player_opp_df = player_opp_df.drop(columns=["GROUP_SET", "COURT_STATUS", "W", "L", "W_PCT", "OPP_FGM", "OPP_FGA", "OPP_FG3M", "OPP_FG3A",
        "OPP_FTM", "OPP_FTA", "OPP_FT_PCT", "OPP_OREB", "OPP_DREB", "OPP_REB", "OPP_AST", "OPP_TOV",
        "OPP_STL", "OPP_BLK", "OPP_BLKA", "OPP_PF", "OPP_PFD", "OPP_PTS", "PLUS_MINUS",
        "GP_RANK", "W_RANK", "L_RANK", "W_PCT_RANK", "MIN_RANK", "OPP_FGM_RANK", "OPP_FGA_RANK",
        "OPP_FG_PCT_RANK", "OPP_FG3M_RANK", "OPP_FG3A_RANK", "OPP_FG3_PCT_RANK", "OPP_FTM_RANK",
        "OPP_FTA_RANK", "OPP_FT_PCT_RANK", "OPP_OREB_RANK", "OPP_DREB_RANK", "OPP_REB_RANK",
        "OPP_AST_RANK", "OPP_TOV_RANK", "OPP_STL_RANK", "OPP_BLK_RANK", "OPP_BLKA_RANK", "OPP_PF_RANK",
        "OPP_PFD_RANK", "OPP_PTS_RANK", "PLUS_MINUS_RANK", 'TEAM_NAME', 'VS_PLAYER_NAME',
        'TEAM_ID', 
        'TEAM_ABBREVIATION', 
        'GP', 
        'MIN'])
    player_opp_df.rename(columns={'VS_PLAYER_ID':'PLAYER_ID'}, inplace=True)

    player_def = leaguedashplayerstats.LeagueDashPlayerStats(measure_type_detailed_defense='Defense', per_mode_detailed='PerGame')
    player_def_df = player_def.get_data_frames()[0]
    player_def_df = player_def_df.drop(columns=["AGE", "W", "L", "W_PCT", "DEF_RATING", "DREB", "DREB_PCT", "PCT_DREB", "STL", "PCT_STL", 
        "BLK", "PCT_BLK", "OPP_PTS_OFF_TOV", "OPP_PTS_2ND_CHANCE", "OPP_PTS_FB", "OPP_PTS_PAINT", 
        "GP_RANK", "W_RANK", "L_RANK", "W_PCT_RANK", "MIN_RANK", "DEF_RATING_RANK", "DREB_RANK", 
        "DREB_PCT_RANK", "PCT_DREB_RANK", "STL_RANK", "PCT_STL_RANK", "BLK_RANK", "PCT_BLK_RANK", 
        "OPP_PTS_OFF_TOV_RANK", "OPP_PTS_2ND_CHANCE_RANK", "OPP_PTS_FB_RANK", "OPP_PTS_PAINT_RANK", 
        "DEF_WS_RANK",'PLAYER_NAME', 
        'NICKNAME', 
        'TEAM_ID', 
        'TEAM_ABBREVIATION', 
        'GP', 
        'MIN'])

    player_past = leaguedashptstats.LeagueDashPtStats(player_or_team='Player', per_mode_simple='PerGame', pt_measure_type='Passing')
    player_past_df = player_past.get_data_frames()[0]
    player_past_df = player_past_df.drop(columns=["W", "L", "PASSES_MADE", "PASSES_RECEIVED", "AST", "FT_AST", "SECONDARY_AST", 
        "AST_POINTS_CREATED", "AST_ADJ", "AST_TO_PASS_PCT", "AST_TO_PASS_PCT_ADJ",'PLAYER_NAME', 
        'TEAM_ID', 
        'TEAM_ABBREVIATION', 
        'GP', 
        'MIN'])
    
    player_sd = leaguedashptstats.LeagueDashPtStats(player_or_team='Player', per_mode_simple='PerGame', pt_measure_type='SpeedDistance')
    player_sd_df = player_sd.get_data_frames()[0]
    player_sd_df = player_sd_df.drop(columns=["W", "L", "MIN1", "DIST_MILES", "DIST_MILES_OFF", "DIST_MILES_DEF", "AVG_SPEED_OFF", "AVG_SPEED_DEF",'PLAYER_NAME', 
        'TEAM_ID', 
        'TEAM_ABBREVIATION', 
        'GP', 
        'MIN'])
    
    player_hustle = leaguehustlestatsplayer.LeagueHustleStatsPlayer(per_mode_time='PerGame')
    player_hustle_df = player_hustle.get_data_frames()[0]
    player_hustle_df = player_hustle_df.drop(columns=["AGE", "CONTESTED_SHOTS", "CONTESTED_SHOTS_2PT", "CONTESTED_SHOTS_3PT", 
        "CHARGES_DRAWN", "SCREEN_ASSISTS", "SCREEN_AST_PTS", "OFF_LOOSE_BALLS_RECOVERED", 
        "DEF_LOOSE_BALLS_RECOVERED", "PCT_LOOSE_BALLS_RECOVERED_OFF", "PCT_LOOSE_BALLS_RECOVERED_DEF", 
        "OFF_BOXOUTS", "DEF_BOXOUTS", "BOX_OUT_PLAYER_TEAM_REBS", "BOX_OUT_PLAYER_REBS", 
        "PCT_BOX_OUTS_OFF", "PCT_BOX_OUTS_DEF", "PCT_BOX_OUTS_TEAM_REB",'PLAYER_NAME',  
        'TEAM_ID', 
        'TEAM_ABBREVIATION', 
        'G', 
        'MIN'])
    
    player_ids = player_base_df['PLAYER_ID'].unique()
    player_dunk_df = []
    for id in player_ids:
        retry_count = 0
        while retry_count < 8:
            try:
                player_dunk = playerdashboardbyshootingsplits.PlayerDashboardByShootingSplits(
                    player_id=id, per_mode_detailed="PerGame", timeout=60
                )
                player_df = player_dunk.get_data_frames()[5]
                dunk_df = player_df[player_df['GROUP_VALUE'] == 'Dunk']

                if not dunk_df.empty:
                    dunk_fga = dunk_df['FGA'].values[0]
                    player_dunk_df.append({'PLAYER_ID': id, 'DUNK_FGA': dunk_fga})
                    print(f"{id} dunk data added")
                else:
                    print(f"{id} has no dunk data")
                
                break  # Exit retry loop on success

            except (requests.exceptions.RequestException, Timeout) as e:
                wait_time = (2 ** retry_count) + random.uniform(0, 1)  # Exponential backoff
                print(f"Retry {retry_count + 1} for {id} after {wait_time:.2f}s: {e}")
                time.sleep(wait_time)
                retry_count += 1
        else:
            print(f"Max retries reached for player {id}.")
        
        time.sleep(10)
            
    player_dunk_df = pd.DataFrame(player_dunk_df)

    player_score = leaguedashplayerstats.LeagueDashPlayerStats(measure_type_detailed_defense='Scoring', per_mode_detailed='PerGame')
    player_score_df = player_score.get_data_frames()[0]
    player_score_df = player_score_df.drop(columns=["PLAYER_NAME", "NICKNAME", "TEAM_ID", "TEAM_ABBREVIATION", "AGE", "GP", "W", "L", "W_PCT", 
            "MIN", "PCT_FGA_2PT", "PCT_FGA_3PT", "PCT_PTS_2PT", "PCT_PTS_2PT_MR", "PCT_PTS_3PT", "PCT_PTS_FB", 
            "PCT_PTS_FT", "PCT_PTS_OFF_TOV", "PCT_PTS_PAINT", "PCT_AST_2PM", "PCT_UAST_2PM", "PCT_AST_3PM", 
            "PCT_UAST_3PM", "PCT_AST_FGM", "FGM", "FGA", "FG_PCT", "GP_RANK", "W_RANK", "L_RANK", "W_PCT_RANK", 
            "MIN_RANK", "PCT_FGA_2PT_RANK", "PCT_FGA_3PT_RANK", "PCT_PTS_2PT_RANK", "PCT_PTS_2PT_MR_RANK", 
            "PCT_PTS_3PT_RANK", "PCT_PTS_FB_RANK", "PCT_PTS_FT_RANK", "PCT_PTS_OFF_TOV_RANK", 
            "PCT_PTS_PAINT_RANK", "PCT_AST_2PM_RANK", "PCT_UAST_2PM_RANK", "PCT_AST_3PM_RANK", 
            "PCT_UAST_3PM_RANK", "PCT_AST_FGM_RANK", "PCT_UAST_FGM_RANK", "FGM_RANK", "FGA_RANK", "FG_PCT_RANK"])

    dataframes= [player_base_df, player_adv_df, player_def_df, player_hustle_df, player_misc_df, player_opp_df, player_past_df, player_sd_df, player_dunk_df, player_score_df]
    combined_df = dataframes[0]

    for df in dataframes[1:]: combined_df = pd.merge(combined_df, df, on='PLAYER_ID', how='inner')

    # Drop duplicates from combined_df
    combined_df = combined_df.drop_duplicates(subset=["PLAYER_ID"], keep="first")

    # Filter combined_df for players with MIN >= 15 and GP >= 20
    # filtered_df = combined_df[(combined_df["MIN"] >= 15) & (combined_df["GP"] >= 20)]

    # Function for Min-Max Scaling (0-1)
    def normalize(series):
        scaler = MinMaxScaler()
        return scaler.fit_transform(series.values.reshape(-1, 1)).flatten()

    # Function for Softer Rescaling
    def rescale(series, factor=10):
        return ((series - series.mean()) / series.std() * factor + 50).clip(0, 100)

    # Scoring Formula
    combined_df["Scoring"] = (0.30 * normalize(combined_df["PTS"]) +
                            0.20 * normalize(combined_df["FGA"]) +
                            0.10 * normalize(combined_df["FTA"]) +
                            0.15 * normalize(combined_df["TS_PCT"]) +
                            0.15 * normalize(combined_df["EFG_PCT"]) +
                            0.10 * normalize(combined_df["PCT_UAST_FGM"])) * 100
    combined_df["Scoring"] = rescale(combined_df["Scoring"], factor=12)

    # Playmaking Formula
    combined_df["Playmaking"] = (0.35 * normalize(combined_df["AST"]) +
                                0.30 * normalize(combined_df["POTENTIAL_AST"]) +
                                0.10 * normalize(combined_df["USG_PCT"]) -
                                0.20 * normalize(combined_df["TOV"])) * 100
    combined_df["Playmaking"] = rescale(combined_df["Playmaking"], factor=11)

    # Rebounding Formula
    combined_df["Rebounding"] = (0.40 * normalize(combined_df["REB"]) +
                                0.35 * normalize(combined_df["OREB"]) +
                                0.35 * normalize(combined_df["DREB"])) * 100
    combined_df["Rebounding"] = rescale(combined_df["Rebounding"], factor=12)

    # Defense Formula
    combined_df["Defense"] = (0.25 * normalize(combined_df["BLK"]) +
                            0.10 * normalize(combined_df["DEFLECTIONS"]) +
                            0.10 * normalize(combined_df["STL"]) -
                            0.15 * normalize(combined_df["PF"]) +
                            #0.15 * normalize(combined_df["DEF_WS"]) -
                            0.25 * normalize(combined_df["OPP_FG_PCT"]) -
                            0.20 * normalize(combined_df["OPP_FG3_PCT"])) * 100
    combined_df["Defense"] = rescale(combined_df["Defense"], factor=10)

    # Athleticism Formula
    combined_df["Athleticism"] = (0.20 * normalize(combined_df["PTS_FB"]) +
                                0.15 * normalize(combined_df["DIST_FEET"]) +
                                0.15 * normalize(combined_df["AVG_SPEED"]) +
                                0.20 * normalize(combined_df["LOOSE_BALLS_RECOVERED"]) +
                                0.05 * normalize(combined_df["BOX_OUTS"]) +
                                0.15 * normalize(combined_df["PCT_BOX_OUTS_REB"]) +
                                0.10 * normalize(combined_df["DUNK_FGA"])) * 100
    combined_df["Athleticism"] = rescale(combined_df["Athleticism"], factor=12)

    combined_df.to_sql(name=table, con=db, if_exists='replace', index=False)
    print("Grades updated")

scheduler = BackgroundScheduler()

@scheduler.scheduled_job('cron', hour=2, timezone='US/Central')
def runPrograms():
    fetchPlayers()
    fetchStandings()
    fetchGamelogs()
    fetchGrades()

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
            g.Athleticism
        FROM players p
        LEFT JOIN grades g ON p.PLAYER_ID = g.PLAYER_ID
    """
    players_db = pd.read_sql(query, con=db)

    players_dict = {}
    for index, row in players_db.iterrows():
        team_id, team_name, player_id, player_name, position, team, jersey_number, points, rebounds, assists, steals, blocks, turnovers, scoring_grade, playmaking_grade, rebounding_grade, defense_grade, athleticism_grade  = row
        if team_id not in players_dict:
            players_dict[team_id] = {'team_name': team_name, 'players': []}
        players_dict[team_id]['players'].append({'player_id': player_id, 'player_name': player_name, 'position': position, 'team': team, 'jersey_number': jersey_number, 'points': points, 'rebounds': rebounds, 'assists': assists, 'steals': steals, 'blocks': blocks, 'turnovers': turnovers, 'scoring_grade': scoring_grade, 'playmaking_grade': playmaking_grade, 'rebounding_grade': rebounding_grade, 'defense_grade': defense_grade, 'athleticism_grade': athleticism_grade})

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
    # fetchPlayers()
    # fetchStandings()
    # fetchGamelogs()
    # fetchGrades()
    app.run(debug=False)
