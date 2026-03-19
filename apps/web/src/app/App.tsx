import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ style: { borderRadius: "12px", fontSize: "13px", fontWeight: 500 } }}
      />
    </>
  );
}
