import React, { useState, useEffect } from 'react'
import DesktopNav from './DesktopNav.jsx'
import MobileNav from './MobileNav.jsx'
import { AiOutlineClose, AiOutlineMenu  } from 'react-icons/ai'

const Header = () => {
  const [nav, setNav] = useState(false)
  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
  ]);

  const handleNav = () => {
    setNav(!nav)
  }

  useEffect(() => {
    const handleWindowResize = () => {
      setWindowSize([window.innerWidth]);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);


  return (
    <header className='flex justify-between items-center bg-[#007ea7] h-20 max-w-[1240px] mx-auto px-4 text-white'>
        <h1 className='w-full text-3xl font-bold text-white'>
            <a href="/">LOGO.</a>
        </h1>
        {windowSize >= 768 ? (
          <div>
            <DesktopNav/>
          </div>
        ) : (
          <>
            <div onClick={handleNav} className='block md:hidden'>
              {nav ? <AiOutlineClose size={20}/> : <AiOutlineMenu size={20}/>}
            </div>
            <div className={nav ? 'fixed left-0 top-0 w-[60%] h-full border-r border-r-gray-900 bg-[#000300] ease-in-out duration-500' : 'fixed left-[-100%]'}>
              <h1 className='w-full text-3xl font-bold text-[#007ea7] m-4'>
                  <a href="/">LOGO.</a>
              </h1>
              <MobileNav/>
            </div>
          </>
        )}
    </header>
  )
}

export default Header