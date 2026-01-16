import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import NavItems from './NavItems'
import UserDropdown from './UserDropdown'
import { searchStocks } from '@/lib/actions/finnhub.actions'


const Header = async ({user}:{user:User}) => {
  const initialStock = await searchStocks();
  return (
    <header className='sticky top-0 header'>
        <div className='container header-wrapper'>
            <Link href='/'>
                <Image src='/assets/icons/logo.svg' alt='logo'
                width={140} height={32}
                className='h-8 w-auto cursor-pointer'
                />
            </Link>
            <nav className='hidden sm:block'>
                <NavItems initialStocks={initialStock}/>
            </nav>
            <UserDropdown user={user} initialStocks={initialStock} />
        </div>
    </header>
  )
}

export default Header