import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full py-4 text-center text-sm text-text-secondary">
      Market.Maker.Softwares©{year}
    </footer>
  );
};

export default Footer;
