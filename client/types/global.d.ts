declare global {
  type CurrentUser = {
    username: string;
    email: string;
  };

  type SelectOption = {
    value: string;
    label: string;
    [key: string]: unknown;
  };
}

export {};
