import React, { useState, useEffect } from 'react';
import Typed from 'react-typed'
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {

  return (
      <div className='text-white'>
        <div className='max-w-[800px] mt-[-96px] w-full h-screen mx-auto text-center flex flex-col justify-center'>
          <p className='text-[#007ea7] font-bold p-2'>GETTING YO MONEY UP</p>
          <h1 className='md:text-7xl sm:text-6xl text-4xl font-bold md:py-6'>Get yo money up.</h1>
          <div className='flex justify-center items-center'>
            <p className='md:text-5xl sm:text-4xl text-xl font-bold py-4'>Statistics and insights for</p>
            <Typed 
            className='md:text-5xl sm:text-4xl text-xl font-bold md:pl-3 sm:pl-2 pl-1'
            strings={['NBA', 'NFL', 'UFC']} typeSpeed={120} backSpeed={140} loop/>
          </div>
          <p className='md:text-2xl text-xl font-bold text-gray-500'>Monitor analytics to increase revenue from every sport.</p>
          {/* <button className='bg-[#007ea7] w-[200px] rounded-md font-medium my-6 mx-auto py-3 text-white'>Get Started</button> */}
        </div>
      </div>
  );
}

export default Home