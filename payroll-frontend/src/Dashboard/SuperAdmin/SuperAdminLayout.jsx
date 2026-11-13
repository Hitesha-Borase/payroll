import React from 'react';

/**
 * SuperAdminLayout Wrapper
 * Renders page content seamlessly within the primary application Navbar and Sidebar context.
 * Prevents double-sidebar offset issues and right-side content overflow.
 */
const SuperAdminLayout = ({ children }) => {
  return (
    <div style={{ width: '100%', minHeight: '100%', padding: '0px' }}>
      {children}
    </div>
  );
};

export default SuperAdminLayout;
