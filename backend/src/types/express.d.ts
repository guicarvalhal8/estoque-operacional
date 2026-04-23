declare global {
  namespace Express {
    interface UserSession {
      id: string;
      name: string;
      email: string;
      role: "ADMIN" | "MANAGER" | "OPERATOR";
    }

    interface Request {
      user?: UserSession;
    }
  }
}

export {};
