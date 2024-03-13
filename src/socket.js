import { io } from "socket.io-client";
const URL = process.env.NODE_ENV === 'production' ? 'https://sketchbook-server-9x72.onrender.com' : 'http://localhost:4000'
 export const socket = io(URL);

