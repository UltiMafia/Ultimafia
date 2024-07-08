import React from 'react';
import { styled, keyframes } from '@mui/material/styles';
import Button from '@mui/material/Button';

const glowing = keyframes`
  0% { background-position: 0 0; }
  50% { background-position: 200% 0; }
  100% { background-position: 0 0; }
`;

const GlowButton = styled(Button)(({ theme }) => ({
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  position: 'relative',
  zIndex: 0,
  borderRadius: '10px',
  overflow: 'hidden',

  '&:before': {
    content: '""',
    background: 'linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000)',
    position: 'absolute',
    top: '-2px',
    left: '-2px',
    backgroundSize: '400%',
    zIndex: -1,
    filter: 'blur(5px)',
    width: 'calc(100% + 4px)',
    height: 'calc(100% + 4px)',
    animation: `${glowing} 20s linear infinite`,
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
    borderRadius: '10px',
  },

  '&:hover:before': {
    opacity: 1,
  },

  '&:after': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: '#111',
    left: 0,
    top: 0,
    zIndex: -1,
    borderRadius: '10px',
  },
}));

export default GlowButton;
