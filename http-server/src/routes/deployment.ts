import express from "express"
import {deploy} from "../contollers/deploy/deploy";

const router=express.Router();

router.post("/deploy",deploy);

export default router;