let handler: () => void = () => {};

export const setSessionExpiredDialogHandler = (fn: () => void) => {
  handler = fn;
};

export const triggerSessionExpiredDialog = () => {
  handler();
};
