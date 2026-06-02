import LabListPage from "../../components/lab-list-page";

export default async function DynamicLabListPage({
  params,
}) {
  const { moduleId } = await params;
  return <LabListPage moduleId={moduleId} />;
}
