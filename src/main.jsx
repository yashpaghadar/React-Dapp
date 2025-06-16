import React from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'

const root = document.getElementById('root')
if (!root) throw new Error('Failed to find the root element')

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

//  npx hardhat run scripts/deploy.js --network sepolia, this command will deploy the contract for HLT tokens.