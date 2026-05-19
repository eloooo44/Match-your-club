export interface RegisterBody {
  email: string;
  password: string;
  role: string;
}

export interface LoginBody {
  email: string;
  password: string;
}