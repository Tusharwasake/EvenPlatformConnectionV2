import { Router } from "express";

import { authentication } from "../middleware/authMiddleware.js";
import { joinGroupAuthentication } from "../middleware/joinGroupAuthentication.js";
import { joinGroupController } from "../controllers/joinGroupController.js";

const joinGroupRouter = Router();
joinGroupRouter.use(authentication);
joinGroupRouter.use("/:groupId", joinGroupAuthentication, joinGroupController);

export { joinGroupRouter };
