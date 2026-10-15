import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <h1 className="p-8 text-2xl font-semibold">WarehouseProject</h1>
  </StrictMode>,
);
