import "dotenv/config";
import express from "express";
import morgan from "morgan";
import session from "express-session";
import flash from 'express-flash';
import MongoStore from "connect-mongo";
import {localsMiddleware} from "./middlewares.js";
import rootRouter from "./routers/rootRouter";
import videoRouter from "./routers/videoRouter";
import userRouter from "./routers/userRouter";
import apiRouter from "./routers/apiRouter";

const app   = express();
const logger = morgan("dev");

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use(logger);
app.use(express.urlencoded({extended: true})); //html로부터 오는 form 정보 읽을 수 있게 해줌
app.use(express.json({extended:true})); //stringifed JSON 받아서 backend에서 다시 object로 바꿔줌. 

app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60000 * 24 * 10, // 10 days

    },
    store: MongoStore.create({
        mongoUrl: process.env.DB_URL,
    })
    })
);
app.use(localsMiddleware);
app.use((req, res, next) => {
    res.header("Cross-Origin-Embedder-Policy", "require-corp");
    res.header("Cross-Origin-Opener-Policy", "same-origin");
    next();
    });
app.use(flash());
app.use("/uploads", express.static("uploads"));
app.use("/assets", express.static("assets"));
app.use("/", rootRouter);
app.use("/videos", videoRouter);
app.use("/users", userRouter);
app.use("/api", apiRouter);


export default app;