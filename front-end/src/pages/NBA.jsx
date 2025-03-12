import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const NBA = () => {
  const [games, setGames] = useState([])
  const [players, setPlayers] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      console.log(process.env.REACT_APP_API_URL)
      const response = await fetch(`${process.env.REACT_APP_API_URL}/games`);
      const data = await response.json();
      setGames(data);
    };

    fetchData();
  }, []);

  const handlePlayers = async (gameId) => {
    try {
      const response = await fetch(`/games/${gameId}`);
      
      if (response.ok) {
        const playerData = await response.json();
        setPlayers(playerData);
      } else {
        console.error("Failed to fetch player data. Status:", response.status);
      }
    } catch (err) {
      console.error("Error fetching player data:", err.message);
    }
  };

  const handleClick = () => {
    ref.current?.scrollIntoView({behavior: 'smooth'})
  }

  return (
    <div className='p-4'>
      <h1 className='text-white text-2xl font-bold'>NBA Games Today</h1>
      <div className='w-full px-4 grid md:grid-cols-3 gap-6'>
        {games.map((game) => (
          <div className='mx-auto w-full'>
            <div className='w-full bg-[#161616] shadow-xl flex flex-col p-4 my-4 rounded-lg hover:scale-105 duration-300'>
                <h2 className='text-xl font-bold text-center pt-8 text-white'>{game[1]} @ {game[3]}</h2>
                {/* <div className='text-center font-medium'>
                    <p className='py-2 border-b mx-8 mt-8'>Odds</p>
                    <p className='py-2 border-b mx-8'>Odds</p>
                    <p className='py-2 border-b mx-8'>Odds</p>
                </div> */}
                <button className='bg-[#007ea7] w-[200px] rounded-md font-medium mx-auto mt-3 py-3 text-white' onClick={() => {handleClick(); handlePlayers(game[0])}}>View Players</button>
            </div>
          </div>
        ))}
      </div>

      {players.away && players.home && players.away.length > 0 && players.home.length > 0 && (
        <>
        <h2 ref={ref} className='text-white text-2xl font-bold pl-4'>Away Team Players</h2>
        <div className='w-full p-4 pb-4 grid md:grid-cols-4 gap-4 text-black'>
          {players.away.map((player) => (
            <div className='w-full bg-[#EDFDFE] mx-auto shadow-xl flex flex-col p-4 my-4 rounded-lg hover:scale-105 duration-300' key={player.id}>
              <h2 className='text-l font-bold text-left pt-2'>{player.name}</h2>
              <h3>{player.position} | {player.team_name} #{player.jersey_number}</h3>
              <Link className='bg-[#00a8e8] w-[200px] rounded-md font-medium text-center mx-auto mt-3 py-3 text-white' to={`/nba/player/${player.id}`}>View Profile</Link>
            </div>
          ))}
          </div>

          <h2 className='text-white text-2xl font-bold pl-4'>Home Team Players</h2>
          <div className='w-full p-4 pb-4 grid md:grid-cols-4 gap-4 text-black'>
            {players.home.map((player) => (
              <div className='w-full bg-[#EDFDFE] mx-auto shadow-xl flex flex-col p-4 my-4 rounded-lg hover:scale-105 duration-300' key={player.id}>
                <h2 className='text-l font-bold text-left pt-2'>{player.name}</h2>
                <h3>{player.position} - {player.team_name} #{player.jersey_number}</h3>
                <Link className='bg-[#00a8e8] w-[200px] rounded-md font-medium text-center mx-auto mt-3 py-3 text-white' to={`/nba/player/${player.id}`}>View Profile</Link>
              </div>
            ))}
        </div>
        </>
      )}
    </div>
  );
}

export default NBA