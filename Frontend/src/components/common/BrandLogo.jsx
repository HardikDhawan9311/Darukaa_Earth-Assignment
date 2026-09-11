import React from 'react';
import logoImg from '../../assets/logo.png';

const BrandLogo = ({ size = 'medium' }) => {
  // Sizing for banner logo image
  let maxHeight = 50;
  if (size === 'small') maxHeight = 46;
  if (size === 'large') maxHeight = 64;
  if (size === 'xlarge') maxHeight = 84;

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <img
        src={logoImg}
        alt="Darukaa Earth Logo"
        style={{
          width: '100%',
          maxHeight: maxHeight,
          objectFit: 'contain',
          objectPosition: 'left center',
          display: 'block',
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
        }}
      />
    </div>
  );
};

export default BrandLogo;
