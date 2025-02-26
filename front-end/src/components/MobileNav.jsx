import React from 'react'
import { menuItemsData } from '../menuItemData.js'
import MenuItems from './MenuItems.jsx'

const MobileNav = () => {
  return (
    <nav>
        <ul>{menuItemsData.map((menu, index) => {
          return <MenuItems items={menu} key={index} />;
        })}</ul>
    </nav>
  )
}

export default MobileNav