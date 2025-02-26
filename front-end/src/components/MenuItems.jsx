import React, { useState } from 'react'
import Dropdown from './Dropdown.jsx'

const MenuItems = ({ items }) => {
    const [dropdown, setDropdown] = useState(false)

    return (
    <li className={`p-4 group`} aria-expanded={dropdown ? "true" : "false"} onClick={() => setDropdown((prev) => !prev)}>
        {items.submenu ? (
            <>
                <li>
                    {items.title}{' '}
                </li>
                <Dropdown submenus={items.submenu} dropdown={dropdown}/>
            </>
        ) : (
            <a href={items.url}>{items.title}</a>
        )}
    </li>
    )
}

export default MenuItems