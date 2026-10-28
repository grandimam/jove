import React from 'react';

export default function JoveWordmark({ hero = false }: { hero?: boolean }) {
  return (
    <span
      aria-label={hero ? 'Jove' : undefined}
      aria-hidden={hero ? undefined : true}
      className={
        'select-none pr-1 font-normal italic leading-none tracking-[-0.035em] text-[#504457] [font-family:Georgia,serif] ' +
        (hero ? '-mt-1 text-[64px] sm:text-[76px]' : 'text-[34px]')
      }
    >
      jove
    </span>
  );
}
