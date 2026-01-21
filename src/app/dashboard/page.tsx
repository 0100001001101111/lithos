import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect to portfolio by default
  redirect('/dashboard/portfolio');
}
