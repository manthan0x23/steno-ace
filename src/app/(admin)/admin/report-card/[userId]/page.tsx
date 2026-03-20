import ReportCardClient from "~/components/common/report-card-client";

export default function Page({ params }: { params: { userId: string } }) {
  return <ReportCardClient userId={params.userId} isAdmin userName="User" />;
}
