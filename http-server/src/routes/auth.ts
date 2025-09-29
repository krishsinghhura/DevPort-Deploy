import {signin} from "../contollers/auth/signin"
import {signup} from "../contollers/auth/signup"
import express from "express"

const router=express.Router();

router.post("/signin",signin);

router.post("/signup",signup);

export default router