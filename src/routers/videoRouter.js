import express from "express";
import {trending, see, edit, remove, upload} from "../controllers/videoController";


const videoRouter = express.Router();


videoRouter.get("/upload", upload);
videoRouter.get("/:id(\\d+)", see);
videoRouter.get("/:id(\\d+)/edit", edit);
videoRouter.get("/:id(\\d+)/delete", remove);
export default videoRouter