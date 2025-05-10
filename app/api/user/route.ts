import { getUser } from "@/lib/db/queries/users";

export async function GET() {
  const user = await getUser();
  return Response.json(user);
}
