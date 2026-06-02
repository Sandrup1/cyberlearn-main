"use client";

import LabDetailsDynamic from "../../components/lab-details-dynamic";

export default function LabPage() {
  return <LabDetailsDynamic moduleId="csrf" labId="lab1" defaultSandboxUrl="/learn/csrf/lab1/exploit-server" />;
}
