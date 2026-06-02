import ModuleContentPage from "../components/module-content-page";

export default async function DynamicModulePage({
  params,
}) {
  const { moduleId } = await params;
  return <ModuleContentPage moduleId={moduleId} />;
}
