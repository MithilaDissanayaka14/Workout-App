import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from "node:dns";

import userRouter from './router/userRouter.js';

dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

const app = express();

app.use(express.json()); 
app.use(cors());

//routers
app.use('/api/users', userRouter);


app.get('/', (req, res) => {
    res.send('Workout Manager API is running...');
});


const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(() => {
        console.log("MongoDB Connected Successfully");
        app.listen(PORT, () => {
            console.log(`Server is flying on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB Connection Failed:", err.message);
    });