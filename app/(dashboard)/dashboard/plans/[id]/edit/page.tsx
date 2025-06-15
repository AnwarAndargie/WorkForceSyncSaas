import React from "react";
import EditPlanPage from "@/components/dashboard/plans/edit/plansEdit";

type Params = {
  id: string;
};

export default async function Page({ params }: { params: Promise<Params> }) {
  const plansId = (await params).id;
  console.log(plansId);

  return (
    <div>
      <EditPlanPage planId={plansId} />
    </div>
  );
}
