import React from 'react'
import { Link } from 'react-router-dom'

const CategoryCard = ({ title = 'Sapatilhas', image = '', buttonText = 'COMPRAR', to = '/products' }) => {
  const style = image ? { backgroundImage: `url(${image})` } : undefined

  return (
    <div
      className='category-card-bg flex min-h-[min(50vh,22rem)] w-full min-w-0 flex-col items-center justify-center gap-3 px-3 py-8 text-center sm:min-h-[min(50vh,30rem)] sm:px-4 md:h-[50vh] md:max-h-[80vh] md:w-3/12'
      style={style}
      data-theme-image='public_category_card_bg_image'
      data-theme-image-label='Category card background'
    >
      <h2 className='text-balance text-2xl font-semibold text-white sm:text-3xl'>{title}</h2>
      <Link
        to={to}
        className='min-h-11 w-full max-w-xs bg-white px-6 py-2.5 text-sm font-medium text-black sm:max-w-sm'
      >
        {buttonText}
      </Link>
    </div>
  )
}

export default CategoryCard
