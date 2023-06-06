import React from "react";
//import ReactDOM from "react-dom/client";
import { createRoot } from 'react-dom/client';
import { HashRouter } from "react-router-dom";

import App from "./App";

import './localization/index';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <HashRouter>
    <App />
  </HashRouter>
);