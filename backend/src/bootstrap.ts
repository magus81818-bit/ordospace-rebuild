import { createAuthService } from "./application/services/auth.service.js";
import { createUserService } from "./application/services/user.service.js";
import { createModuleCardService } from "./application/services/module-card.service.js";
import { createAuthController } from "./inbound/controllers/auth.controller.js";
import { createUserController } from "./inbound/controllers/user.controller.js";
import { createModuleCardController } from "./inbound/controllers/module-card.controller.js";
import { createAuthMiddleware } from "./inbound/middlewares/auth.middleware.js";
import { createUserRepo } from "./outbound/repos/user.repo.js";
import { createModuleCardRepo } from "./outbound/repos/module-card.repo.js";
import { createActivityRepo } from "./outbound/repos/activity.repo.js";
import { bcryptUtil } from "./shared/utils/bcrypt.util.js";
import { signJwt, jwtUtil } from "./shared/utils/jwt.util.js";

// 조립 공장: repo → service → controller 순서로 의존성 주입
export const bootstrap = () => {
  // 1) outbound
  const { findUserByEmail, createUser, findUserById } = createUserRepo();
  const {
    findAllForRole,
    findById,
    create: createCard,
    update: updateCard,
  } = createModuleCardRepo();
  const { create: createActivity } = createActivityRepo();

  // 2) application
  const { signIn, signUp } = createAuthService(
    findUserByEmail,
    createUser,
    signJwt,
    bcryptUtil,
  );
  const { getMe } = createUserService(findUserById);
  const moduleCardService = createModuleCardService(
    findAllForRole,
    findById,
    createCard,
    updateCard,
    createActivity,
  );

  // 3) inbound
  const authMiddleware = createAuthMiddleware(jwtUtil.verifyJwt);
  const { router: authRouter } = createAuthController(signIn, signUp);
  const { router: userRouter } = createUserController(getMe, authMiddleware);
  const { router: moduleCardRouter } = createModuleCardController(
    moduleCardService,
    authMiddleware,
  );

  return { authRouter, userRouter, moduleCardRouter };
};
