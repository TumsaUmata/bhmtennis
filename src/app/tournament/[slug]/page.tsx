import { redirect } from "next/navigation";

export default async function TournamentIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/tournament/${slug}/mens-singles`);
}
