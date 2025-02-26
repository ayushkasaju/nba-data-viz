import React from 'react'
import { menuItemsData } from '../menuItemData.js'
import MenuItems from './MenuItems.jsx'

const DesktopNav = () => {
  return (
    <nav>
        <ul className='flex'>{menuItemsData.map((menu, index) => {
          return <MenuItems items={menu} key={index} />;
        })}</ul>
    </nav>
  )
}

export default DesktopNav