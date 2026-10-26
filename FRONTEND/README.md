# TRUST-GEO frontend

## Running with the backend

1. Start the Python backend (from `Desktop/trust-geo`): `python -m backend.server` (listens on 127.0.0.1:8000)
2. Start this app: `npm install` then `npm run dev`, and open http://localhost:5173

Vite proxies `/api` to the backend (see `vite.config.js`). All backend calls go through
`src/api.js`; set `VITE_API_BASE` to point at a different backend URL. If the backend is not
running, cards show "Cannot reach the backend" instead of data.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
