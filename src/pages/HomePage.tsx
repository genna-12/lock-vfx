import React from 'react';
import { MasterLockScene } from '../components/sections/MasterLockScene';
import { SiteFooter } from '../components/layout/SiteFooter';

export const HomePage: React.FC = () => {
  return (
    <div className="w-full bg-[#020202] text-[#F3F4F6]">
      <MasterLockScene />
      <SiteFooter />
    </div>
  );
};