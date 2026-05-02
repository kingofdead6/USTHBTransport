import axios from "axios";

export const API_BASE = "https://usthbtransport.onrender.com/api";

export const api = axios.create({ baseURL: API_BASE });

export const fmt = {
  date: (d) => (d ? new Date(d).toLocaleDateString("fr-DZ") : "—"),
  datetime: (d) => (d ? new Date(d).toLocaleString("fr-DZ") : "—"),
  pct: (n) => `${n ?? 0}%`,
};