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

from sklearn.preprocessing import MinMaxScaler, RobustScaler
from sklearn.cluster import KMeans

import requests
from requests.exceptions import Timeout
import random
from math import isnan

import sqlalchemy
import os
from dotenv import load_dotenv
import logging

# Setup logging to a file for persistence
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('/home/ec2-user/nba-data-viz/api/scheduler.log'),
        logging.StreamHandler()  # Optional: also log to console
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Database setup
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_NAME = os.getenv('DB_NAME')
db = sqlalchemy.create_engine(f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}")

# Move your fetch functions here from app.py
def fetchPlayers():
    table = "players"
    try:
        active_players = playerindex.PlayerIndex(timeout=60)  # Increase timeout to 60s
        players_df = active_players.get_data_frames()[0]
        players_df["PLAYER_FULL_NAME"] = players_df["PLAYER_FIRST_NAME"] + " " + players_df["PLAYER_LAST_NAME"]
        columns_to_remove = [col for col in players_df.columns if any(substring in col for substring in ('PLAYER_SLUG', 'TEAM_SLUG', 'IS_DEFUNCT', 'STATS_TIMEFRAME'))]
        players_df = players_df.drop(columns=columns_to_remove)
        players_df["TEAM_FULL_NAME"] = players_df["TEAM_CITY"] + " " + players_df["TEAM_NAME"]
        players_df = players_df[['TEAM_ID', 'TEAM_FULL_NAME', 'PERSON_ID', 'PLAYER_FIRST_NAME', 'PLAYER_LAST_NAME', 'PLAYER_FULL_NAME', 'POSITION', 'TEAM_NAME', 'JERSEY_NUMBER', 'HEIGHT', 'WEIGHT', 'COLLEGE', 'DRAFT_YEAR', 'DRAFT_ROUND', 'DRAFT_NUMBER']]
        players_df = players_df.rename(columns={'PERSON_ID': 'PLAYER_ID'})
        data_dict = {
            'TEAM_ID': int, 'TEAM_FULL_NAME': str, 'PLAYER_ID': int, 'PLAYER_FIRST_NAME': str, 'PLAYER_LAST_NAME': str,
            'PLAYER_FULL_NAME': str, 'POSITION': str, 'TEAM_NAME': str, 'JERSEY_NUMBER': str, 'HEIGHT': str, 'WEIGHT': str,
            'COLLEGE': str, 'DRAFT_YEAR': str, 'DRAFT_ROUND': str, 'DRAFT_NUMBER': str
        }
        players_df = players_df.astype(data_dict)
        players_df['DRAFT_YEAR'] = pd.to_numeric(players_df['DRAFT_YEAR'], errors='coerce').fillna(0).astype(int)
        players_df['DRAFT_ROUND'] = pd.to_numeric(players_df['DRAFT_ROUND'], errors='coerce').fillna(0).astype(int)
        players_df['DRAFT_NUMBER'] = pd.to_numeric(players_df['DRAFT_NUMBER'], errors='coerce').fillna(0).astype(int)
        players_df.to_sql(name=table, con=db, if_exists='replace', index=False)
        logger.info("Players table updated successfully")
    except Exception as e:
        logger.error("Error in fetchPlayers: %s", str(e))
        raise  # Re-raise to ensure runPrograms logs the failure

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
    
    try:
        logger.info("Fetching gamelogs")
        active = playerindex.PlayerIndex(timeout=60)
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
    except Exception as e:
        logger.error("Error in fetchGamelogs: %s", str(e))
        raise

def fetchStandings():
    table = "standings"
    try:
        standings = leaguestandingsv3.LeagueStandingsV3(timeout=60)
        standings_df = standings.get_data_frames()[0]
        standings_df.to_sql(name=table, con=db, if_exists='replace', index=False)
        logger.info("Standings updated")
    except Exception as e:
        logger.error("Error in fetchStandings: %s", str(e))
        raise

def fetchGrades():
    table = "grades"

    try:
        logger.info("Fetching grades")
        # Fetch and clean base stats
        player_base = leaguedashplayerstats.LeagueDashPlayerStats(measure_type_detailed_defense='Base', per_mode_detailed='PerGame', timeout=60)
        player_base_df = player_base.get_data_frames()[0]
        player_base_df = player_base_df.drop(columns=['AGE', 'W', 'L', 'W_PCT', 'FGM', 'FG_PCT', 'FG3A', 'FG3M', 'FG3_PCT', 'FTM', 'FT_PCT', 'BLKA', 'PFD', "PLUS_MINUS", "NBA_FANTASY_PTS", "DD2", "TD3", "WNBA_FANTASY_PTS", "GP_RANK", "W_RANK", "L_RANK", "W_PCT_RANK", "MIN_RANK", "FGM_RANK", "FGA_RANK", "FG_PCT_RANK", "FG3M_RANK", "FG3A_RANK", "FG3_PCT_RANK", "FTM_RANK", "FTA_RANK", "FT_PCT_RANK", "OREB_RANK", "DREB_RANK", "REB_RANK", "AST_RANK", "TOV_RANK", "STL_RANK", "BLK_RANK", "BLKA_RANK", "PF_RANK", "PFD_RANK", "PTS_RANK", "PLUS_MINUS_RANK", "NBA_FANTASY_PTS_RANK", "DD2_RANK", "TD3_RANK", "WNBA_FANTASY_PTS_RANK"], axis=1)

        # Fetch and clean advanced stats
        player_adv = leaguedashplayerstats.LeagueDashPlayerStats(measure_type_detailed_defense='Advanced', per_mode_detailed='PerGame', timeout=60)
        player_adv_df = player_adv.get_data_frames()[0]
        player_adv_df = player_adv_df.drop(columns=["AGE", "W", "L", "W_PCT", "E_OFF_RATING", "OFF_RATING", "sp_work_OFF_RATING", "E_DEF_RATING", "DEF_RATING", "sp_work_DEF_RATING", "E_NET_RATING", "NET_RATING", "sp_work_NET_RATING", "AST_PCT", "AST_TO", "AST_RATIO", "OREB_PCT", "DREB_PCT", "REB_PCT", "TM_TOV_PCT", "E_TOV_PCT", "E_USG_PCT", "E_PACE", "PACE", "PACE_PER40", "sp_work_PACE", "PIE", "POSS", "FGM", "FGA", "FGM_PG", "FGA_PG", "FG_PCT", "GP_RANK", "W_RANK", "L_RANK", "W_PCT_RANK", "MIN_RANK", "E_OFF_RATING_RANK", "OFF_RATING_RANK", "sp_work_OFF_RATING_RANK", "E_DEF_RATING_RANK", "DEF_RATING_RANK", "sp_work_DEF_RATING_RANK", "E_NET_RATING_RANK", "NET_RATING_RANK", "sp_work_NET_RATING_RANK", "AST_PCT_RANK", "AST_TO_RANK", "AST_RATIO_RANK", "OREB_PCT_RANK", "DREB_PCT_RANK", "REB_PCT_RANK", "TM_TOV_PCT_RANK", "E_TOV_PCT_RANK", "EFG_PCT_RANK", "TS_PCT_RANK", "USG_PCT_RANK", "E_USG_PCT_RANK", "E_PACE_RANK", "PACE_RANK", "sp_work_PACE_RANK", "PIE_RANK", "FGM_RANK", "FGA_RANK", "FGM_PG_RANK", "FGA_PG_RANK", "FG_PCT_RANK", 'PLAYER_NAME', 'NICKNAME', 'TEAM_ID', 'TEAM_ABBREVIATION', 'GP', 'MIN'])

        # Fetch and clean misc stats
        player_misc = leaguedashplayerstats.LeagueDashPlayerStats(measure_type_detailed_defense='Misc', per_mode_detailed='PerGame', timeout=60)
        player_misc_df = player_misc.get_data_frames()[0]
        player_misc_df = player_misc_df.drop(columns=["AGE", "W", "L", "W_PCT", "PTS_OFF_TOV", "PTS_2ND_CHANCE", "PTS_PAINT", "OPP_PTS_OFF_TOV", "OPP_PTS_2ND_CHANCE", "OPP_PTS_FB", "OPP_PTS_PAINT", "BLK", "BLKA", "PF", "PFD", "NBA_FANTASY_PTS", "GP_RANK", "W_RANK", "L_RANK", "W_PCT_RANK", "MIN_RANK", "PTS_OFF_TOV_RANK", "PTS_2ND_CHANCE_RANK", "PTS_FB_RANK", "PTS_PAINT_RANK", "OPP_PTS_OFF_TOV_RANK", "OPP_PTS_2ND_CHANCE_RANK", "OPP_PTS_FB_RANK", "OPP_PTS_PAINT_RANK", "BLK_RANK", "BLKA_RANK", "PF_RANK", "PFD_RANK", "NBA_FANTASY_PTS_RANK", 'PLAYER_NAME', 'NICKNAME', 'TEAM_ID', 'TEAM_ABBREVIATION', 'GP', 'MIN'])

        # Fetch opponent stats by team
        team_ids = player_base_df['TEAM_ID'].unique()
        player_opp_df = []
        for id in team_ids:
            player_opp = leagueplayerondetails.LeaguePlayerOnDetails(team_id=id, measure_type_detailed_defense='Opponent', per_mode_detailed='PerGame', timeout=60)
            p_opp_df = player_opp.get_data_frames()[0]
            player_opp_df.append(p_opp_df)
            time.sleep(1)

        # Concatenate all dataframes
        player_opp_df = pd.concat(player_opp_df, ignore_index=True)

        # Group by PLAYER_ID and aggregate the statistics
        player_opp_df = player_opp_df.groupby('VS_PLAYER_ID').agg({
            'OPP_FG_PCT': 'mean',    # Use mean for percentage stats
            'OPP_FG3_PCT': 'mean',
            # Add other percentage or rate stats you want to keep as means
        }).reset_index()

        # Rename the column to match your expected output
        player_opp_df.rename(columns={'VS_PLAYER_ID': 'PLAYER_ID'}, inplace=True)

        # Drop unwanted columns (adjust this list based on what you actually need)
        columns_to_drop = ["GROUP_SET", "COURT_STATUS", "W", "L", "W_PCT", "OPP_FGM", "OPP_FGA", 
                        "OPP_FG3M", "OPP_FG3A", "OPP_FTM", "OPP_FTA", "OPP_FT_PCT", 
                        "OPP_OREB", "OPP_DREB", "OPP_REB", "OPP_AST", "OPP_TOV", 
                        "OPP_STL", "OPP_BLK", "OPP_BLKA", "OPP_PF", "OPP_PFD", 
                        "OPP_PTS", "PLUS_MINUS", "GP_RANK", "W_RANK", "L_RANK", 
                        "W_PCT_RANK", "MIN_RANK", "OPP_FGM_RANK", "OPP_FGA_RANK", 
                        "OPP_FG_PCT_RANK", "OPP_FG3M_RANK", "OPP_FG3A_RANK", 
                        "OPP_FG3_PCT_RANK", "OPP_FTM_RANK", "OPP_FTA_RANK", 
                        "OPP_FT_PCT_RANK", "OPP_OREB_RANK", "OPP_DREB_RANK", 
                        "OPP_REB_RANK", "OPP_AST_RANK", "OPP_TOV_RANK", 
                        "OPP_STL_RANK", "OPP_BLK_RANK", "OPP_BLKA_RANK", 
                        "OPP_PF_RANK", "OPP_PFD_RANK", "OPP_PTS_RANK", 
                        "PLUS_MINUS_RANK", 'TEAM_NAME', 'VS_PLAYER_NAME', 
                        'TEAM_ID', 'TEAM_ABBREVIATION', 'GP', 'MIN']

        # Remove only columns that exist in the dataframe
        columns_to_drop = [col for col in columns_to_drop if col in player_opp_df.columns]
        player_opp_df = player_opp_df.drop(columns=columns_to_drop)

        # Fetch and clean defense stats
        player_def = leaguedashplayerstats.LeagueDashPlayerStats(measure_type_detailed_defense='Defense', per_mode_detailed='PerGame', timeout=60)
        player_def_df = player_def.get_data_frames()[0]
        player_def_df = player_def_df.drop(columns=["AGE", "W", "L", "W_PCT", "DEF_RATING", "DREB", "DREB_PCT", "PCT_DREB", "STL", "PCT_STL", "BLK", "PCT_BLK", "OPP_PTS_OFF_TOV", "OPP_PTS_2ND_CHANCE", "OPP_PTS_FB", "OPP_PTS_PAINT", "GP_RANK", "W_RANK", "L_RANK", "W_PCT_RANK", "MIN_RANK", "DEF_RATING_RANK", "DREB_RANK", "DREB_PCT_RANK", "PCT_DREB_RANK", "STL_RANK", "PCT_STL_RANK", "BLK_RANK", "PCT_BLK_RANK", "OPP_PTS_OFF_TOV_RANK", "OPP_PTS_2ND_CHANCE_RANK", "OPP_PTS_FB_RANK", "OPP_PTS_PAINT_RANK", "DEF_WS_RANK", 'PLAYER_NAME', 'NICKNAME', 'TEAM_ID', 'TEAM_ABBREVIATION', 'GP', 'MIN'])

        # Fetch and clean passing stats
        player_past = leaguedashptstats.LeagueDashPtStats(player_or_team='Player', per_mode_simple='PerGame', pt_measure_type='Passing', timeout=60)
        player_past_df = player_past.get_data_frames()[0]
        player_past_df = player_past_df.drop(columns=["W", "L", "PASSES_MADE", "PASSES_RECEIVED", "AST", "FT_AST", "AST_POINTS_CREATED", "AST_ADJ", "AST_TO_PASS_PCT", "AST_TO_PASS_PCT_ADJ", 'PLAYER_NAME', 'TEAM_ID', 'TEAM_ABBREVIATION', 'GP', 'MIN'])

        # Fetch and clean speed/distance stats
        player_sd = leaguedashptstats.LeagueDashPtStats(player_or_team='Player', per_mode_simple='PerGame', pt_measure_type='SpeedDistance', timeout=60)
        player_sd_df = player_sd.get_data_frames()[0]
        player_sd_df = player_sd_df.drop(columns=["W", "L", "MIN1", "DIST_MILES", "DIST_MILES_OFF", "DIST_MILES_DEF", "AVG_SPEED_OFF", "AVG_SPEED_DEF", 'PLAYER_NAME', 'TEAM_ID', 'TEAM_ABBREVIATION', 'GP', 'MIN'])

        # Fetch and clean hustle stats
        player_hustle = leaguehustlestatsplayer.LeagueHustleStatsPlayer(per_mode_time='PerGame', timeout=60)
        player_hustle_df = player_hustle.get_data_frames()[0]
        player_hustle_df = player_hustle_df.drop(columns=["AGE", "CONTESTED_SHOTS", "CONTESTED_SHOTS_2PT", "CONTESTED_SHOTS_3PT", "CHARGES_DRAWN", "SCREEN_ASSISTS", "SCREEN_AST_PTS", "OFF_LOOSE_BALLS_RECOVERED", "DEF_LOOSE_BALLS_RECOVERED", "PCT_LOOSE_BALLS_RECOVERED_OFF", "PCT_LOOSE_BALLS_RECOVERED_DEF", "OFF_BOXOUTS", "DEF_BOXOUTS", "BOX_OUT_PLAYER_TEAM_REBS", "BOX_OUT_PLAYER_REBS", "PCT_BOX_OUTS_OFF", "PCT_BOX_OUTS_DEF", "PCT_BOX_OUTS_TEAM_REB", 'PLAYER_NAME', 'TEAM_ID', 'TEAM_ABBREVIATION', 'G', 'MIN'])

        # Fetch dunk data
        player_ids = player_base_df['PLAYER_ID'].unique()
        player_dunk_df = []
        for id in player_ids:
            retry_count = 0
            while retry_count < 8:
                try:
                    player_dunk = playerdashboardbyshootingsplits.PlayerDashboardByShootingSplits(player_id=id, per_mode_detailed="PerGame", timeout=60)
                    player_df = player_dunk.get_data_frames()[5]
                    dunk_df = player_df[player_df['GROUP_VALUE'] == 'Dunk']
                    if not dunk_df.empty:
                        dunk_fga = dunk_df['FGA'].values[0]
                        player_dunk_df.append({'PLAYER_ID': id, 'DUNK_FGA': dunk_fga})
                        print(f"{id} dunk data added")
                    else:
                        print(f"{id} has no dunk data")
                    break
                except (requests.exceptions.RequestException, Timeout) as e:
                    wait_time = (2 ** retry_count) + random.uniform(0, 1)
                    print(f"Retry {retry_count + 1} for {id} after {wait_time:.2f}s: {e}")
                    time.sleep(wait_time)
                    retry_count += 1
            else:
                print(f"Max retries reached for player {id}.")
            time.sleep(10)
        player_dunk_df = pd.DataFrame(player_dunk_df)

        # Fetch and clean scoring stats
        player_score = leaguedashplayerstats.LeagueDashPlayerStats(measure_type_detailed_defense='Scoring', per_mode_detailed='PerGame', timeout=60)
        player_score_df = player_score.get_data_frames()[0]
        player_score_df = player_score_df.drop(columns=["PLAYER_NAME", "NICKNAME", "TEAM_ID", "TEAM_ABBREVIATION", "AGE", "GP", "W", "L", "W_PCT", "MIN", "PCT_FGA_2PT", "PCT_FGA_3PT", "PCT_PTS_2PT", "PCT_PTS_2PT_MR", "PCT_PTS_FB", "PCT_PTS_FT", "PCT_PTS_OFF_TOV", "PCT_AST_2PM", "PCT_UAST_2PM", "PCT_AST_3PM", "PCT_UAST_3PM", "PCT_AST_FGM", "FGM", "FGA", "FG_PCT", "GP_RANK", "W_RANK", "L_RANK", "W_PCT_RANK", "MIN_RANK", "PCT_FGA_2PT_RANK", "PCT_FGA_3PT_RANK", "PCT_PTS_2PT_RANK", "PCT_PTS_2PT_MR_RANK", "PCT_PTS_3PT_RANK", "PCT_PTS_FB_RANK", "PCT_PTS_FT_RANK", "PCT_PTS_OFF_TOV_RANK", "PCT_PTS_PAINT_RANK", "PCT_AST_2PM_RANK", "PCT_UAST_2PM_RANK", "PCT_AST_3PM_RANK", "PCT_UAST_3PM_RANK", "PCT_AST_FGM_RANK", "PCT_UAST_FGM_RANK", "FGM_RANK", "FGA_RANK", "FG_PCT_RANK"])

        # Merge all DataFrames
        dataframes = [player_base_df, player_adv_df, player_def_df, player_hustle_df, player_misc_df, player_opp_df, player_past_df, player_sd_df, player_dunk_df, player_score_df]
        combined_df = dataframes[0]
        for df in dataframes[1:]:
            combined_df = pd.merge(combined_df, df, on='PLAYER_ID', how='inner')

        # Drop duplicates and filter for relevant players
        combined_df = combined_df.drop_duplicates(subset=["PLAYER_ID"], keep="first")
        # filtered_df = combined_df[(combined_df["MIN"] >= 15) & (combined_df["GP"] >= 20)]

        # Normalization and rescaling functions
        def normalize(series):
            scaler = MinMaxScaler()
            return scaler.fit_transform(series.values.reshape(-1, 1)).flatten()

        def rescale(series, factor=10):
            return ((series - series.mean()) / series.std() * factor + 50).clip(0, 100)

        # Scoring Formula: Emphasize efficiency and shot creation
        combined_df["Scoring"] = (0.30 * normalize(combined_df["PTS"]) +
                                0.10 * normalize(combined_df["FGA"]) +
                                0.10 * normalize(combined_df["FTA"]) +
                                0.20 * normalize(combined_df["TS_PCT"]) +
                                0.10 * normalize(combined_df["EFG_PCT"]) +
                                0.20 * normalize(combined_df["PCT_UAST_FGM"])) * 100
        combined_df["Scoring"] = rescale(combined_df["Scoring"], factor=12)

        # Playmaking Formula: Include secondary assists for facilitators
        combined_df["Playmaking"] = (0.30 * normalize(combined_df["AST"]) +
                                    0.20 * normalize(combined_df["POTENTIAL_AST"]) +
                                    0.20 * normalize(combined_df["SECONDARY_AST"]) +
                                    0.15 * normalize(combined_df["USG_PCT"]) -
                                    0.15 * normalize(combined_df["TOV"])) * 100
        combined_df["Playmaking"] = rescale(combined_df["Playmaking"], factor=10)

        # Rebounding Formula: Keep simple and balanced
        combined_df["Rebounding"] = (0.40 * normalize(combined_df["REB"]) +
                                    0.30 * normalize(combined_df["OREB"]) +
                                    0.30 * normalize(combined_df["DREB"])) * 100
        combined_df["Rebounding"] = rescale(combined_df["Rebounding"], factor=10)

        # Defense Formula: Use player-specific metrics (your latest version)
        combined_df["Defense"] = (0.30 * normalize(combined_df["BLK"]) +
                                0.15 * normalize(combined_df["DEFLECTIONS"]) +
                                0.15 * normalize(combined_df["STL"]) +
                                0.10 * normalize(combined_df["DEF_WS"]) -
                                0.15 * normalize(combined_df["PF"]) +
                                0.15 * normalize(1 - combined_df["OPP_FG_PCT"])) * 100
        combined_df["Defense"] = rescale(combined_df["Defense"], factor=8)

        # Athleticism Formula: Broaden to include speed and steals (your latest version)
        combined_df["Athleticism"] = (0.25 * normalize(combined_df["PTS_FB"]) +
                                    0.20 * normalize(combined_df["DIST_FEET"]) +
                                    0.20 * normalize(combined_df["AVG_SPEED"]) +
                                    0.20 * normalize(combined_df["LOOSE_BALLS_RECOVERED"]) +
                                    0.15 * normalize(combined_df["DUNK_FGA"])) * 100
        combined_df["Athleticism"] = rescale(combined_df["Athleticism"], factor=12)

        # Apply rescaling and compute ranks
        categories = ["Scoring", "Playmaking", "Rebounding", "Defense", "Athleticism"]
        for category in categories:
            # combined_df[category] = rescale(combined_df[category], factor=10)
            combined_df[f"{category}_Rank"] = combined_df[category].rank(pct=True) * 100

        # Compute average grade for relative strengths/weaknesses
        combined_df["Avg_Grade"] = combined_df[categories].mean(axis=1)
        # for category in categories:
        #     combined_df[f"{category}_Diff"] = combined_df[category] - combined_df["Avg_Grade"]

        # Cluster-based archetype classification
        # kmeans = KMeans(n_clusters=10, random_state=42)
        # combined_df["Cluster"] = kmeans.fit_predict(combined_df[categories])

        # Updated archetype assignment with refined rules
        def assign_archetype(row):
            scores = {
                "Scoring": row["Scoring"],
                "Playmaking": row["Playmaking"],
                "Rebounding": row["Rebounding"],
                "Defense": row["Defense"],
                "Athleticism": row["Athleticism"]
            }

            # Calculate additional flags for specialization
            league_medians = combined_df[["STL", "BLK", "SECONDARY_AST", "OPP_FG3_PCT"]].median()
            is_shooter = row["PCT_PTS_3PT"] > 0.40 and row["FG3_PCT"] > 0.37  # High 3PT volume and efficiency
            is_rim_finisher = row["DUNK_FGA"] > 4.0 or row["PCT_PTS_PAINT"] > 0.5  # Dunks or paint-heavy
            is_perimeter_defender = row["STL"] > league_medians["STL"] * 1.5 and row["OPP_FG3_PCT"] < league_medians["OPP_FG3_PCT"] * 0.9
            is_rim_protector = row["BLK"] > league_medians["BLK"] * 1.5
            
            # Get top two categories and their scores
            sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
            top_cat, top_score = sorted_scores[0]
            second_cat, second_score = sorted_scores[1]
            third_cat, third_score = sorted_scores[2]

            # Calculate difference for balance vs. skew
            score_diff = top_score - second_score
            
            # Check for extreme cases first
            if row['Avg_Grade'] < 40 and row['MIN'] < 15:
                return "Benchwarmer"  # Low all-around performer
            
            if all(45 <= score <= 55 for score in scores.values()):
                return "Role Player"  # Average, well-rounded, no standout traits
            
            # Style-based archetype rules with balanced vs. skewed logic
            if top_cat == "Scoring":
                if second_cat == "Playmaking":
                    if is_shooter:
                        return "Sharpshooting Maestro"
                    elif score_diff <= 10 and top_score >= 75:
                        return "Dual-Threat Maestro"
                    elif score_diff > 15:
                        return "Shot Creator"
                    return "Scoring Playmaker"
                elif second_cat == "Athleticism":
                    if is_rim_finisher:
                        return "Explosive Finisher"
                    elif score_diff <= 10 and top_score >= 75:
                        return "Athletic Scorer"
                    elif score_diff > 15:
                        return "Dynamic Finisher"
                    return "Scoring Athlete"
                elif second_cat == "Defense":
                    if is_perimeter_defender:
                        return "Perimeter Two-Way Threat"
                    elif score_diff <= 10 and top_score >= 75:
                        return "Two-Way Star"
                    elif score_diff > 15:
                        return "Defensive Scorer"
                    return "Scoring Defender"
                elif second_cat == "Rebounding":
                    if is_rim_finisher:
                        return "Scoring Interior Force"
                    elif score_diff <= 10 and top_score >= 75:
                        return "Interior Dual-Threat"
                    elif score_diff > 15:
                        return "Paint Powerhouse"
                    return "Scoring Rebounder"
            
            elif top_cat == "Playmaking":
                if second_cat == "Scoring":
                    if row["SECONDARY_AST"] > league_medians["SECONDARY_AST"] * 1.5:
                        return "Orchestrating Star"
                    elif score_diff <= 10 and top_score >= 75:
                        return "Playmaking Scorer"
                    elif score_diff > 15:
                        return "Dual-Threat Guard"
                    return "Facilitating Scorer"
                elif second_cat == "Defense":
                    if is_perimeter_defender:
                        return "Defensive Floor General"
                    elif score_diff <= 10 and top_score >= 75:
                        return "Disruptive Playmaker"
                    elif score_diff > 15:
                        return "Pesky Facilitator"
                    return "Defensive Distributor"
                elif second_cat == "Athleticism":
                    if score_diff <= 10 and top_score >= 75:
                        return "Dynamic Facilitator"
                    elif score_diff > 15:
                        return "Pace Pusher"
                    return "Athletic Playmaker"
                elif second_cat == "Rebounding":
                    if score_diff <= 10 and top_score >= 75:
                        return "Rebounding Playmaker"
                    elif score_diff > 15:
                        return "Rebound Distributor"
                    return "Board Passer" if third_score < 60 else "Rebounding Maestro"
            
            elif top_cat == "Rebounding":
                if second_cat == "Defense":
                    if is_rim_protector:
                        return "Rim Guardian"
                    elif score_diff <= 10 and top_score >= 75:
                        return "Defensive Rebounder"
                    elif score_diff > 15:
                        return "Paint Protector"
                    return "Rebounding Defender"
                elif second_cat == "Scoring":
                    if score_diff <= 10 and top_score >= 75:
                        return "Scoring Boardmaster"
                    elif score_diff > 15:
                        return "Post Operator"
                    return "Rebounding Scorer"
                elif second_cat == "Athleticism":
                    if score_diff <= 10 and top_score >= 75:
                        return "Athletic Board-Crasher"
                    elif score_diff > 15:
                        return "Energy Big"
                    return "Rebounding Athlete"
                elif second_cat == "Playmaking":
                    if score_diff <= 10 and top_score >= 75:
                        return "Facilitating Rebounder"
                    elif score_diff > 15:
                        return "Outlet Specialist"
                    return "Board Facilitator"
            
            elif top_cat == "Defense":
                if second_cat == "Rebounding":
                    if is_rim_protector:
                        return "Defensive Anchor"
                    elif score_diff <= 10 and top_score >= 75:
                        return "Rebounding Stopper"
                    elif score_diff > 15:
                        return "Interior Wall"
                    return "Defensive Rebounder"
                elif second_cat == "Athleticism":
                    if is_perimeter_defender:
                        return "Perimeter Hawk"
                    elif score_diff <= 10 and top_score >= 75:
                        return "Athletic Defender"
                    elif score_diff > 15:
                        return "Active Defender"
                    return "Hustle Defender"
                elif second_cat == "Scoring":
                    if score_diff <= 10 and top_score >= 75:
                        return "Two-Way Threat"
                    elif score_diff > 15:
                        return "Defensive Scorer"
                    return "Scoring Stopper"
                elif second_cat == "Playmaking":
                    if score_diff <= 10 and top_score >= 75:
                        return "Playmaking Defender"
                    elif score_diff > 15:
                        return "Pesky Facilitator"
                    return "Disruptive Distributor"
            
            elif top_cat == "Athleticism":
                if second_cat == "Scoring":
                    if is_rim_finisher:
                        return "Athletic Phenom"
                    elif score_diff <= 10 and top_score >= 75:
                        return "Scoring Dynamo"
                    elif score_diff > 15:
                        return "Highlight Maker"
                    return "Athletic Scorer"
                elif second_cat == "Defense":
                    if is_perimeter_defender:
                        return "Energy Stopper"
                    elif score_diff <= 10 and top_score >= 75:
                        return "Defensive Athlete"
                    elif score_diff > 15:
                        return "Hustle Spark"
                    return "Active Athlete"
                elif second_cat == "Rebounding":
                    if score_diff <= 10 and top_score >= 75:
                        return "Rebounding Dynamo"
                    elif score_diff > 15:
                        return "Rebound Athlete"
                    return "Athletic Board-Grabber"
                elif second_cat == "Playmaking":
                    if score_diff <= 10 and top_score >= 75:
                        return "Playmaking Athlete"
                    elif score_diff > 15:
                        return "Fast-Break Igniter"
                    return "Dynamic Distributor"
            
            return "Versatile Contributor"

        combined_df["Archetype"] = combined_df.apply(assign_archetype, axis=1)

        # Save to database
        combined_df.to_sql(name=table, con=db, if_exists='replace', index=False)
        print("Grades and archetypes updated")
        logger.info("Grades updated")
    except Exception as e:
        logger.error("Error in fetchGrades: %s", str(e))
        raise

# Initialize scheduler
scheduler = BackgroundScheduler()

@scheduler.scheduled_job('cron', hour=2, timezone='US/Central')
def runPrograms():
    logger.info("Scheduler triggered runPrograms")
    try:
        fetchPlayers()
        fetchStandings()
        fetchGamelogs()
        fetchGrades()
    except Exception as e:
        logger.error("Error in runPrograms: %s", str(e))

if __name__ == '__main__':
    logger.info("Starting scheduler")
    scheduler.start()
    logger.info("Scheduler started. Next run: %s", scheduler.get_jobs()[0].next_run_time)
    try:
        while True:
            time.sleep(60)  # Keep the process alive
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        logger.info("Scheduler shut down")