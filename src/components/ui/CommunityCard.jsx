import React from 'react'

function CommunityCard({ image, alt }) {
  return (
    <div className='w-full aspect-[2/3] overflow-hidden bg-neutral-100'>
      <img className='h-full w-full object-cover object-center' src={image} alt={alt} />
    </div>
  )
}

export default CommunityCard
