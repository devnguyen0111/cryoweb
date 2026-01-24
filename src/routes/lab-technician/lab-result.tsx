import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/lab-technician/lab-result')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/lab-technician/lab-result"!</div>
}
