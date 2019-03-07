import { injectable, inject } from "inversify";
import AuthServiceInterface from "varie-auth-plugin/lib/AuthServiceInterface";
import RouteMiddlewareInterface from "varie/lib/routing/RouteMiddlewareInterface";

@injectable()
export default class Auth implements RouteMiddlewareInterface {
  private authService;

  constructor(@inject("AuthService") authService: AuthServiceInterface) {
    this.authService = authService;
  }

  handler(to, from, next) {
    this.authService.isLoggedIn().then((isLoggedIn) => {
      if (isLoggedIn) {
        switch (to.name) {
          case "home":
            next({
              name: "dashboard",
            });
            break;
          case "dashboard":
            next({
              name: "home",
            });
            break;
        }
      }
      return next();
    });
  }
}