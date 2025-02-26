// import {
//   createBrowserRouter,
//   Outlet,
//   RouterProvider,
// } from "react-router-dom";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route
} from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import Home from './pages/Home'
import NBA from './pages/NBA';
import Players from './pages/Players';
import Profile from './pages/Profile'
import Header from './components/Header';
import Teams from './pages/Teams';

const App = () => {
  return (
    <div>
      <Header/>
      <Router>
        <Routes>
          <Route exact path ='/' Component={Home}/>
          <Route path='/nba/games' Component={NBA}/>
          <Route path='/nba/teams' element={<Teams/>}/>
          <Route path='/nba/players' Component={Players}/>
          <Route path="/:sport/player/:playerId" Component={Profile}/>
        </Routes>
      </Router>
    </div>
  )
}

export default App;
