import GenericLabPage from "../../components/generic-lab-page";

export default async function SQLiGenericLabPage({
  params,
}) {
  const { labId } = await params;
  return <GenericLabPage moduleId="sqli" labId={labId} />;
}
