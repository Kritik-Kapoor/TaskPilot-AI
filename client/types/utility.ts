export type Action = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
};

export type GroupProps = {
  label?: string;
  actions: Action[];
};
