import GenericLabPage from "../../components/generic-lab-page";

export default async function XxeLabPage({
  params,
}) {
  const { labId } = await params;
  return <GenericLabPage moduleId="xxe" labId={labId} />;
}
