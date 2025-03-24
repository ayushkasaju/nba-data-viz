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
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]); // Runs whenever the pathname changes

  return null; // This component doesn't render anything
}

const App = () => {
  return (
    <div>
      <Router>
        <ScrollToTop/>
        <Navbar/>
        <div className='pt-16'>
          <Routes>
            <Route exact path ='/' Component={Home}/>
            <Route path='/games' Component={NBA}/>
            <Route path='/teams' element={<Teams/>}/>
            <Route path='/team/:teamId' Component={TeamProfile}/>
            <Route path='/players' Component={Players}/>
            <Route path="/:sport/player/:playerId" Component={Profile}/>
          </Routes>
        </div>
      </Router>
    </div>
  )
}

export default App;
