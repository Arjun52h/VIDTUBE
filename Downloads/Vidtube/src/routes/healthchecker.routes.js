import { healthchecker } from "../controller/helathchecker.controller.js";
import { Router } from "express";
  
const router = Router()
router.route("/").get(healthchecker)

export default router 
export { healthchecker }