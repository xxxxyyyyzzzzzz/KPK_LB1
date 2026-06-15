import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/join/$code")({
  component: JoinRedirect,
});

function JoinRedirect() {
  const { code } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Зберегти код в sessionStorage щоб LoginScreen його підхопив
    sessionStorage.setItem("kpk_join_code", code.toUpperCase());
    navigate({ to: "/" });
  }, [code, navigate]);

  return null;
}
