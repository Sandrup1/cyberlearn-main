import GenericLabPage from "../../components/generic-lab-page";

export default async function CSRFGenericLabPage({
  params,
}) {
  const { labId } = await params;
  return <GenericLabPage moduleId="csrf" labId={labId} />;
}
