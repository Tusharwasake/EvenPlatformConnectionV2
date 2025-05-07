import { Router } from "express";
import { filterByCategory } from "../controllers/catergoriesController.js";
import { authentication } from "../middleware/authMiddleware.js";
const filterRoutes = Router();

filterRoutes.use(authentication);
filterRoutes.get("/:category", filterByCategory);

export { filterRoutes };
