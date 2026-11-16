'use client';

import React from 'react';
import { FloatingNavbar } from './layout/FloatingNavbar';
import { MobileBottomBar } from './layout/MobileBottomBar';

export const Navbar: React.FC = () => {
  return (
    <>
      <FloatingNavbar />
      <MobileBottomBar />
    </>
  );
};

export { FloatingNavbar, MobileBottomBar };
