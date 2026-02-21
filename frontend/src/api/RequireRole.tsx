import { Navigate } from "react-router-dom"

type Props = {
  role: string
  children: React.ReactNode
}

export default function RequireRole({ role, children }: Props) {
  const storedRole = localStorage.getItem("role")

  if (storedRole !== role) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}