import React from 'react'

const Dropdown = ({ submenus, dropdown }) => {
  return (
    <ul className='hidden group-hover:block md:absolute bg-[#007ea7] py-3 pl-1 pr-3'>
        {submenus.map((submenu, index) => (
            <li key={index}>
                <a href={submenu.url}>{submenu.title}</a>
            </li>
        ))}
    </ul>
  )
}

export default Dropdown