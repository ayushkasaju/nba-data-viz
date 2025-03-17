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
import Teams from './pages/Teams';
import Navbar from './components/Navbar';
import TeamProfile from './pages/TeamProfile';

const App = () => {
  return (
    <div>
      <Router>
        <Navbar/>
        <div className='pt-16'>
          <Routes>
            <Route exact path ='/' Component={Home}/>
            <Route path='/games' Component={NBA}/>
            <Route path='/teams' element={<Teams/>}/>
            <Route path='/teams/:teamId' Component={TeamProfile}/>
            <Route path='/players' Component={Players}/>
            <Route path="/:sport/player/:playerId" Component={Profile}/>
          </Routes>
        </div>
      </Router>
    </div>
  )
}

export default App;
