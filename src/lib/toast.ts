import { Toast } from "@base-ui/react/toast";

// Global toast manager (Base UI). Lets any client component enqueue a toast
// with `toastManager.add(...)` without needing to be inside the provider tree;
// the <Toaster /> mounted in the root layout is wired to this same instance.
export const toastManager = Toast.createToastManager();
